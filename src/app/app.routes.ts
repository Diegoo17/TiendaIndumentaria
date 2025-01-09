import { Routes } from '@angular/router';
import { ListaProductosComponent } from './components/lista-productos/lista-productos.component';
import { AgregarUsuarioComponent } from './components/agregar-usuario/agregar-usuario.component';
import { ListaUsuariosComponent } from './components/lista-usuarios/lista-usuarios.component';
import { HomeComponent } from './components/home/home.component';
import { AgregarProductoComponent } from './components/agregar-producto/agregar-producto.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { AccesoDenegadoComponent } from './components/acceso-denegado/acceso-denegado.component';
import { AdminGuard } from './guards/admin.guard';
import { AgregarAdminComponent } from './components/agregar-admin/agregar-admin.component';
import { AdminListaProductosComponent } from './components/admin-lista-productos/admin-lista-productos.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'productos', component: ListaProductosComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: AgregarUsuarioComponent },
    { path: 'carrito', component: CarritoComponent, canActivate: [AuthGuard], data: { redirectTo: '/login' } },
    { path: 'usuarios', component: ListaUsuariosComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
    { path: 'acceso-denegado', component: AccesoDenegadoComponent },
    {path: 'agregar-producto', component: AgregarProductoComponent, canActivate: [AuthGuard, AdminGuard]},
    {path: 'agregar-admin', component: AgregarAdminComponent, canActivate: [AuthGuard, AdminGuard]},
    { path: 'productosAdmin', component: AdminListaProductosComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: '**', redirectTo: '/home' }
];
