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
  concepto: string;
  cantidad: number;
  comprobante?: string;
  fecha?: Date | string;
}

export interface IEgreso {
  id?: number;
  concepto: string;
  cantidad: number;
  comprobante?: string;
  fecha?: Date | string;
}

export interface IUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: number;
  telefono: string;
}