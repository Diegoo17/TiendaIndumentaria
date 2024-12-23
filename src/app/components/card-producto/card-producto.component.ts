import { Component, EventEmitter, Input, Output, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito/carrito.service';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-producto.component.html',
  styleUrl: './card-producto.component.css'
})
export class CardProductoComponent {
  @Input() producto: any;
  @Input() isAdmin : boolean = false;

  @Output() eliminarProducto = new EventEmitter<number>();
  mostrarDetalles = false;
  isAuthenticated = false;

  constructor(
    private ngZone: NgZone,
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  toggleDetalles(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.ngZone.run(() => {
      this.mostrarDetalles = !this.mostrarDetalles;
    });
  }

  cerrarModal(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.ngZone.run(() => {
      this.mostrarDetalles = false;
    });
  }

  onEliminar() {
    this.eliminarProducto.emit(this.producto.id);
  }

  agregarAlCarrito() {
    if (!this.isAuthenticated) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      this.router.navigate(['/login']);
      return;
    }
    alert('Producto agregado al carrito');
    this.carritoService.agregarAlCarrito(this.producto);
  }

  getWhatsappLink() {
    const mensaje = encodeURIComponent(
      `Hola! Me interesa el producto: ${this.producto.name} - $${this.producto.price}`
    );
    return `https://wa.me/message/TKWZTL4TOU7MN1?text=${mensaje}`;
  }


}