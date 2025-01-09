import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carritoItems = new BehaviorSubject<any[]>([]);
  private totalItems = new BehaviorSubject<number>(0);
  private totalPrecio = new BehaviorSubject<number>(0);

  constructor() {
  }

  cargarCarrito(userId: string | null) {
    if (userId) {
      const savedCart = localStorage.getItem(`carrito_${userId}`);
      this.carritoItems.next(savedCart ? JSON.parse(savedCart) : []);
      this.actualizarTotales();
      console.log('Carrito cargado para el usuario:', userId);
    } else {
      console.log('No se pudo cargar el carrito: UserID es nulo.');
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
    const userId = this.getUserId();
    console.log("El usuario con este id agrego un producto al carrito: ", userId);
    if (!userId) return;

    const currentItems = this.carritoItems.value;
    const itemExistente = currentItems.find(item => item.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += 1;
      this.carritoItems.next([...currentItems]);
    } else {
      this.carritoItems.next([...currentItems, { ...producto, cantidad: 1 }]);
    }

    this.actualizarTotales();
    this.guardarEnLocalStorage(userId);
  }

  removerDelCarrito(productoId: number) {
    const userId = this.getUserId();
    console.log("El usuario con este id removio un producto del carrito: ", userId);

    if (!userId) return;

    const currentItems = this.carritoItems.value;
    const nuevosItems = currentItems.filter(item => item.id !== productoId);
    this.carritoItems.next(nuevosItems);
    this.actualizarTotales();
    this.guardarEnLocalStorage(userId);
  }

  actualizarCantidad(productoId: number, cantidad: number) {
    const userId = this.getUserId();
    if (!userId) return;

    const currentItems = this.carritoItems.value;
    const item = currentItems.find(item => item.id === productoId);
    if (item) {
      item.cantidad = cantidad;
      this.carritoItems.next([...currentItems]);
      this.actualizarTotales();
      this.guardarEnLocalStorage(userId);
    }
  }

  private actualizarTotales() {
    const items = this.carritoItems.value;
    this.totalItems.next(items.reduce((total, item) => total + item.cantidad, 0));
    this.totalPrecio.next(items.reduce((total, item) => total + (item.price * item.cantidad), 0));
  }

  limpiarCarrito() {
    const userId = this.getUserId();
    if (!userId) return;

    this.carritoItems.next([]);
    this.actualizarTotales();
    localStorage.removeItem(`carrito_${userId}`);
  }

  private guardarEnLocalStorage(userId: string) {
    const key = `carrito_${userId}`;
    const carritoActual = this.carritoItems.value;
  
    localStorage.setItem(key, JSON.stringify(carritoActual));
  
    console.log('Contenido guardado en localStorage:', localStorage.getItem(key));
  }

  private getUserId(): string | null {
    const userId = localStorage.getItem('userId');
    return userId;  
  }
  iniciarSesionUsuario() {
    const userId = this.getUserId();
    if (userId) {
      const savedCart = localStorage.getItem(`carrito_${userId}`);
      this.carritoItems.next(savedCart ? JSON.parse(savedCart) : []);
      this.actualizarTotales();
      console.log('Carrito cargado para el usuario:', userId);
    } else {
      console.log('No se pudo cargar el carrito: UserID es nulo.');
    }
  }
}