export interface Producto {
    id: number;
    name: string;
    price: string;
    descripcion: string;
    imagen: string;
    talles: { size: string; stock: number }[];
}