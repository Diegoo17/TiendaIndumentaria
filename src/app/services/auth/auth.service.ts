import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient,private router: Router){
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
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_role', response.role);
  
          const user = {
            id: response.userId,
            role: response.role,
          };
          localStorage.setItem('user', JSON.stringify(user));
  
          this.isAuthenticatedSubject.next(true);
          console.log('Token guardado:', response.token);
        }
      })
    );
  }

  isAdmin(): boolean {
    const role = localStorage.getItem(this.userRoleKey);
    console.log('Rol actual:', role);
    return role === 'admin';
  }

  getRole(): string | null {
    return localStorage.getItem(this.userRoleKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userRoleKey);
    localStorage.removeItem('user');
    
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

  getUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  actualizarPerfil(datos: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/usuarios/profile`, datos, { headers })
      .pipe(
        tap(response => console.log('Perfil actualizado:', response))
      );
  }
}
