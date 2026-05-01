/**
 * Este código define un Data Transfer Object (DTO) para la creación de eventos en un servicio de órdenes. El DTO se llama `CreateEventDto` y contiene las siguientes propiedades:
 *
 * - `name`: una cadena que representa el nombre del evento.
 * - `description`: una cadena que proporciona una descripción del evento.
 * - `date`: un objeto de tipo `Date` que indica la fecha del evento.
 * - `inventory`: un número que representa la cantidad de inventario disponible para el evento.
 */
export class CreateEventDto {
  name!: string;
  description!: string;
  date!: Date;
  inventory!: number;
}