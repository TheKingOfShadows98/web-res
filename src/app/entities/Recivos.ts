export interface IRecivoIngreso{ 
Id: string
Correlativo : number
From : string
Recive : string
Fecha : Date
Concepto : string
Direccion : string
Cantidad : number
FormaDePago : PAY_METHOD_ENUM
}

export interface IRecivoEgreso {
  Id: string;
  Correlativo: number;
  From: string;
  Recive: string;
  Fecha: Date;
  Concepto: string;
  Direccion: string;
  Cantidad: number;
  FormaDePago: PAY_METHOD_ENUM;
}

export enum PAY_METHOD_ENUM{
EFECTIVO,
CHECHE,
TRANSFERENCIA_BANCARIA,
TARJETA,
BITCOIN
}

export interface IIngreso {
  id?: number;
  correlativo?: string;
  concepto: string;
  cantidad: number;
  comprobante?: string | null;
  fecha?: Date | string;
  hash?: string;
  prev_hash?: string;
}

export interface IEgreso {
  id?: number;
  correlativo?: string;
  concepto: string;
  cantidad: number;
  comprobante?: string | null;
  fecha?: Date | string;
  hash?: string;
  prev_hash?: string;
}

export enum UserRole {
  MIEMBRO = 0,
  COLABORADOR = 1,
  ADMINISTRADOR = 2,
  AUDITOR = 3,
  OWNER = 4,
}

export interface IUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole | number;
  telefono: string;
}