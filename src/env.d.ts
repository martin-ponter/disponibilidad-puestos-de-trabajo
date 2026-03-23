/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_BITRIX_ENTITY_TYPE_ID?: string;
  readonly PUBLIC_BITRIX_FIELD_EMPLEADO_ASIGNADO?: string;
  readonly PUBLIC_BITRIX_FIELD_CENTRO?: string;
  readonly PUBLIC_BITRIX_FIELD_SALA?: string;
  readonly PUBLIC_BITRIX_FIELD_RECURSO?: string;
  readonly PUBLIC_BITRIX_FIELD_TIPO_RECURSO?: string;
  readonly PUBLIC_BITRIX_FIELD_MODO_RESERVA?: string;
  readonly PUBLIC_BITRIX_FIELD_FECHA?: string;
  readonly PUBLIC_BITRIX_FIELD_HORA_INICIO?: string;
  readonly PUBLIC_BITRIX_FIELD_HORA_FIN?: string;
  readonly PUBLIC_BITRIX_FIELD_ESTADO?: string;
  readonly PUBLIC_BITRIX_FIELD_OBSERVACIONES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
