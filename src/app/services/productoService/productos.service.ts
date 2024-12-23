import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Producto } from '../../interface/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) { }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      map(productos => productos.map(producto => ({
        ...producto,
        imagen: producto.imagen ? `http://localhost:3000${producto.imagen}` : 'assets/images/placeholder.jpg'
      })))
    );
  }

  agregarProducto(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/agregar`, formData);
  }

  eliminarProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
}
