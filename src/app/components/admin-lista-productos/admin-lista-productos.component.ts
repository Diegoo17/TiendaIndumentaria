import { Component } from '@angular/core';
import { Producto } from '../../interface/producto';
import { ProductosService } from '../../services/productoService/productos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-lista-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-lista-productos.component.html',
  styleUrl: './admin-lista-productos.component.css',
})
export class AdminListaProductosComponent {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda: string = '';
  productoSeleccionado: Producto | null = null;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productosService.getProductos().subscribe({
      next: (data: Producto[]) => {
        this.productos = data.map((producto) => ({
          ...producto,
          talles: producto.talles || [],
          imagen: producto.imagen.startsWith('/uploads')
            ? `http://localhost:3000${producto.imagen}`
            : producto.imagen,
        }));
        this.productosFiltrados = [...this.productos];
      },
      error: (error) => {
        console.error('Error al cargar los productos', error);
      },
    });
  }

  filtrarProductos(): void {
    const filtro = this.busqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter((producto) =>
      producto.name?.toLowerCase().includes(filtro)
    );
  }
  
  eliminarProducto(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.productosService.eliminarProducto(id).subscribe({
        next: () => this.cargarProductos(),
        error: (error) => console.error('Error al eliminar el producto', error),
      });
    }
  }

  verDetalles(id: number): void {
    console.log('Mostrar detalles del producto con ID:', id);
    this.productoSeleccionado = this.productos.find((p) => p.id === id) || null;
    console.log('Producto seleccionado:', this.productoSeleccionado);
  }
  

  actualizarProducto(): void {
    if (!this.productoSeleccionado) {
      Swal.fire('Error', 'No se ha seleccionado ningún producto para actualizar', 'error');
      return;
    }
  
    const { id, name, descripcion, price, talles, imagen } = this.productoSeleccionado;
  
    if (!id) {
      Swal.fire('Error', 'El producto seleccionado no tiene un ID válido', 'error');
      return;
    }
  
    // Corrige la URL de la imagen para no duplicar la base
    const imagenFinal = imagen.startsWith('http://localhost:3000/uploads')
      ? imagen.replace('http://localhost:3000', '') // Elimina el prefijo duplicado
      : imagen;
  
    const productoActualizado: Producto = {
      id,
      name,
      descripcion,
      price,
      talles,
      imagen: imagenFinal, // Usa la imagen corregida
    };
  
    this.productosService.actualizarProducto(productoActualizado).subscribe({
      next: (response) => {
        console.log('Producto actualizado:', JSON.stringify(response, null, 2));  // Log detallado
        Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
        this.productoSeleccionado = null;
        this.cargarProductos();
      },
      error: (error) => {
        console.error('Error al actualizar el producto', error);
        Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
      },
    });
  }
  
  
}
