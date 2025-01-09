import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CarritoService } from '../carrito/carrito.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private tokenKey = 'auth_token';
  private userRoleKey = 'user_role';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private userIdKey = 'user_id';
  private userId: string | null = null;
  constructor(private http: HttpClient,private router: Router, private carritoService: CarritoService) {
    const token = this.getToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.userIdKey, response.userId);
          localStorage.setItem(this.tokenKey, response.token); 
          localStorage.setItem(this.userRoleKey, response.role); 
          this.isAuthenticatedSubject.next(true);
          localStorage.setItem('userId', JSON.stringify({ id: response.userId }));

          const userId = response.userId;
          this.carritoService.cargarCarrito(userId);
          console.log('Token guardado:', response.token);
        }
      })
    );
  }

  isAdmin(): boolean {
    const role = localStorage.getItem(this.userRoleKey);
    return role === 'admin';
  }

  getRole(): string | null {
    return localStorage.getItem(this.userRoleKey);
  }

  logout() {
    const userId = this.getUser(); // Asegúrate de que esto devuelve el ID correcto
    
      localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userRoleKey);
    localStorage.removeItem('user');
    localStorage.removeItem(this.userIdKey);
  
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  
    this.router.navigate(['/login']);
  }
  

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Verificando si está logueado. Token:', token);
    return !!token;
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  setAuthenticated(value: boolean) {
    this.isAuthenticatedSubject.next(value);
  }

  getUser(): string | null {
    const userId = localStorage.getItem(this.userIdKey);
    console.log('AuthService - UserID:', userId);
    return userId;
  }
  setUser(userId: string | null, token : string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem('user', JSON.stringify({ id: userId }));  // Almacena el nuevo usuario en localStorage
  }

  actualizarPerfil(datos: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/usuarios/profile`, datos, { headers })
      .pipe(
        tap(response => console.log('Perfil actualizado:', response))
      );
  }
}
