import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito/carrito.service';

@Component({
    selector: 'app-carrito',
    imports: [CommonModule],
    templateUrl: './carrito.component.html',
    styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {

  private carritoService = inject(CarritoService);
  
  items$ = this.carritoService.getCarritoItems();
  totalPrecio$ = this.carritoService.getTotalPrecio();

  ngOnInit() {}

  actualizarCantidad(productoId: number, cantidad: number) {
    if (cantidad > 0) {
      this.carritoService.actualizarCantidad(productoId, cantidad);
    }
  }

  removerItem(productoId: number) {
    this.carritoService.removerDelCarrito(productoId);
  }

  limpiarCarrito() {
    this.carritoService.limpiarCarrito();
  }

}
