import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario } from '../../interface/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost:3000/usuarios';

  constructor(private http: HttpClient) { }

  

  registrarUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario).pipe(
      tap(response => console.log('Usuario registrado:', response)),
      catchError(error => {
        console.error('Error al registrar usuario:', error);
        return throwError(() => error);
      })
    );
  }
  registrarAdmin(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registrar-admin`, usuario).pipe(
      tap(response => console.log('Admin registrado:', response)),
      catchError(error => {
        console.error('Error al registrar usuario:', error);
        return throwError(() => error);
      })
    );
  }
  
  getUsuarios(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return throwError(() => new Error('No hay token disponible'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.apiUrl}`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-email`, { email });
  }
  checkTelefono(telefono: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-telefono`, { telefono });
  }
  
  eliminarUsuario(id: number): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(response => console.log('Usuario eliminado:', response)),
      catchError(error => {
        console.error('Error al eliminar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(id: string): Observable<Usuario> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(response => console.log('Usuario obtenido:', response)),
      catchError(error => {
        console.error('Error al obtener usuario:', error);
        return throwError(() => error);
      })
    );
  }

  putUsuario(userId : string | any, userData : any): Observable<Usuario> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.put(`${this.apiUrl}/${userId}`, userData, { headers }).pipe(
      tap((response: any) => {
        console.log('Perfil actualizado:', response);
      })
    );
    
  }

}
