import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CuotasManagementService } from '../cuotas-management.service';
import { TipoSubdivisionEnum, QuincenaEnum } from '../../domain/enums';
import { CuotasRepository } from '../../infrastructure/cuotas.repository';
import { IAuthGateway } from '../../gateways/IAuthGateway';

describe('CuotasManagementService', () => {
  let mockRepo: Partial<CuotasRepository>;
  let mockAuth: Partial<IAuthGateway>;
  let service: CuotasManagementService;

  beforeEach(() => {
    mockRepo = {
      createZona: vi.fn(),
      createSubdivision: vi.fn(),
      createCasa: vi.fn(),
      updateCasa: vi.fn(),
      deleteCasa: vi.fn(),
      deleteSubdivision: vi.fn(),
      deleteZona: vi.fn(),
    };

    mockAuth = {
      canManageStructure: vi.fn(),
    };

    service = new CuotasManagementService(
      mockRepo as CuotasRepository,
      mockAuth as IAuthGateway
    );
  });

  it('debe rechazar la creación de zona si el usuario NO es Owner', async () => {
    vi.mocked(mockAuth.canManageStructure!).mockResolvedValue(false);

    await expect(
      service.createZona('user-admin-no-owner', { nombre: 'Zona 4' })
    ).rejects.toThrow('Permiso denegado: Solo el rol Owner');
  });

  it('debe permitir crear zona si el usuario es Owner', async () => {
    vi.mocked(mockAuth.canManageStructure!).mockResolvedValue(true);
    vi.mocked(mockRepo.createZona!).mockResolvedValue({
      id: 'z-4',
      nombre: 'Zona 4',
      descripcion: 'Nueva zona',
    });

    const res = await service.createZona('user-owner', { nombre: 'Zona 4', descripcion: 'Nueva zona' });
    expect(mockRepo.createZona).toHaveBeenCalledWith({ nombre: 'Zona 4', descripcion: 'Nueva zona' });
    expect(res.id).toBe('z-4');
  });

  it('debe validar que los nombres de zona y subdivisión no estén vacíos', async () => {
    vi.mocked(mockAuth.canManageStructure!).mockResolvedValue(true);

    await expect(service.createZona('user-owner', { nombre: '   ' })).rejects.toThrow(
      'El nombre de la zona es obligatorio'
    );

    await expect(
      service.createSubdivision('user-owner', {
        zonaId: 'z-1',
        tipo: TipoSubdivisionEnum.EDIFICIO,
        nombre: '',
      })
    ).rejects.toThrow('El nombre del edificio, calle o pasaje es obligatorio');
  });

  it('debe registrar una casa con sus cuotas y quincenas correctamente', async () => {
    vi.mocked(mockAuth.canManageStructure!).mockResolvedValue(true);
    vi.mocked(mockRepo.createCasa!).mockResolvedValue({
      id: 'casa-101',
      subdivisionId: 'sub-1',
      numero: 'Apto 101',
      cuota: 15,
      quincena: QuincenaEnum.SEGUNDA,
      activo: true,
    });

    const res = await service.createCasa('user-owner', {
      subdivisionId: 'sub-1',
      numero: 'Apto 101',
      cuota: 15,
      quincena: QuincenaEnum.SEGUNDA,
    });

    expect(mockRepo.createCasa).toHaveBeenCalledWith({
      subdivisionId: 'sub-1',
      numero: 'Apto 101',
      cuota: 15,
      quincena: QuincenaEnum.SEGUNDA,
    });
    expect(res.id).toBe('casa-101');
    expect(res.cuota).toBe(15);
  });

  it('debe permitir eliminar subdivisión y zona si el usuario es Owner', async () => {
    vi.mocked(mockAuth.canManageStructure!).mockResolvedValue(true);

    await service.deleteSubdivision('user-owner', 'sub-1');
    expect(mockRepo.deleteSubdivision).toHaveBeenCalledWith('sub-1');

    await service.deleteZona('user-owner', 'zona-1');
    expect(mockRepo.deleteZona).toHaveBeenCalledWith('zona-1');
  });
});
