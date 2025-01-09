import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
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
        imagen: producto.imagen ? `http://localhost:3000${producto.imagen}` : 'assets/images/placeholder.jpg',
        sizes: producto.talles || []  // Asignamos 'talles' a 'sizes' en el mapeo
      })))
    );
  }
  

  agregarProducto(formData: FormData): Observable<Producto> {
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

    return this.http.post<Producto>(`${this.apiUrl}/agregar`, formData,  {headers});
  }

  eliminarProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
  actualizarProducto(producto: Producto): Observable<any> {
    const url = `http://localhost:3000/productos/${producto.id}`;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });
  
    return this.http.put(url, producto, { headers }).pipe(
      tap((response: any) => {
        console.log('Producto actualizado:', JSON.stringify(response, null, 2)); // Log detallado
      })
    );
  }
  

}
