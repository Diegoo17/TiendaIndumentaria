import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../services/productoService/productos.service';
import { CommonModule } from '@angular/common';
import { CardProductoComponent } from '../card-producto/card-producto.component';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../interface/producto';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, CardProductoComponent, FormsModule],
  templateUrl: './lista-productos.component.html',
  styleUrl: './lista-productos.component.css', 
})
export class ListaProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda: string = '';
  precioMin: number | null = null;
  precioMax: number | null = null;
  tipoSeleccionado: string = '';
  tiposProductos: string[] = [];
  isAdmin: boolean = false;

  constructor(
    private productosService: ProductosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.isAdmin = this.authService.isAdmin();
  }

  cargarProductos(): void {
    this.productosService.getProductos().subscribe({
      next: (data: Producto[]) => {
        console.log('Datos recibidos:', data);
        this.productos = data;
        this.productosFiltrados = [...data];
        this.tiposProductos = [...new Set(data.map(producto => producto.name))]; 
      },
      error: (error) => {
        console.error('Error al cargar los productos', error);
      },
    });
  }

aplicarFiltros(): void {
  this.productosFiltrados = this.productos.filter(producto => {
    const nombre = producto.name || ''; 
    const precio = producto.price ? parseFloat(producto.price) : 0; 

    const nombreMatch = !this.busqueda || 
      nombre.toLowerCase().includes(this.busqueda.toLowerCase());

    const tipoMatch = !this.tipoSeleccionado || 
      this.tipoSeleccionado === nombre;

    const precioMinMatch = this.precioMin === null || 
      precio >= this.precioMin;

    const precioMaxMatch = this.precioMax === null || 
      precio <= this.precioMax;

    return nombreMatch && tipoMatch && precioMinMatch && precioMaxMatch;
  });

  console.log('Productos filtrados:', this.productosFiltrados);
}
  

  limpiarFiltros(): void {
    this.busqueda = '';
    this.precioMin = null;
    this.precioMax = null;
    this.tipoSeleccionado = '';
    this.productosFiltrados = [...this.productos];
  }

  eliminarProducto(id: number): void {
    this.productosService.eliminarProducto(id).subscribe({
      next: () => {
        this.cargarProductos();
      },
      error: (error) => {
        console.error('Error al eliminar el producto:', error);
      },
    });
  }
}
