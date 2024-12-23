import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carritoItems = new BehaviorSubject<any[]>([]);
  private totalItems = new BehaviorSubject<number>(0);
  private totalPrecio = new BehaviorSubject<number>(0);

  constructor() {
    const savedCart = localStorage.getItem('carrito');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      this.carritoItems.next(cart);
      this.actualizarTotales();
    }
  }

  getCarritoItems() {
    return this.carritoItems.asObservable();
  }

  getTotalItems() {
    return this.totalItems.asObservable();
  }

  getTotalPrecio() {
    return this.totalPrecio.asObservable();
  }

  agregarAlCarrito(producto: any) {
    const currentItems = this.carritoItems.value;
    const itemExistente = currentItems.find(item => item.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += 1;
      this.carritoItems.next([...currentItems]);
    } else {
      this.carritoItems.next([...currentItems, { ...producto, cantidad: 1 }]);
    }

    this.actualizarTotales();
    this.guardarEnLocalStorage();
  }

  removerDelCarrito(productoId: number) {
    const currentItems = this.carritoItems.value;
    const nuevosItems = currentItems.filter(item => item.id !== productoId);
    this.carritoItems.next(nuevosItems);
    this.actualizarTotales();
    this.guardarEnLocalStorage();
  }

  actualizarCantidad(productoId: number, cantidad: number) {
    const currentItems = this.carritoItems.value;
    const item = currentItems.find(item => item.id === productoId);
    if (item) {
      item.cantidad = cantidad;
      this.carritoItems.next([...currentItems]);
      this.actualizarTotales();
      this.guardarEnLocalStorage();
    }
  }

  private actualizarTotales() {
    const items = this.carritoItems.value;
    this.totalItems.next(items.reduce((total, item) => total + item.cantidad, 0));
    this.totalPrecio.next(items.reduce((total, item) => total + (item.price * item.cantidad), 0));
  }

  limpiarCarrito() {
    this.carritoItems.next([]);
    this.actualizarTotales();
    localStorage.removeItem('carrito');
  }

  private guardarEnLocalStorage() {
    localStorage.setItem('carrito', JSON.stringify(this.carritoItems.value));
  }
}