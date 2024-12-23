import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';
import { Usuario } from '../../interface/usuario';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe({
      next: (response: any) => {
        if (response.success && response.usuarios) {
          this.usuarios = response.usuarios;
        } else {
          console.error('Formato de respuesta inesperado:', response);
        }
      },
      error: (error) => {
        console.error('Error detallado:', error);
        if (error.status === 403) {
          alert('No tienes permisos para ver la lista de usuarios');
        } else {
          alert('Error al cargar la lista de usuarios');
        }
      }
    });
  }

  eliminarUsuario(id: number | undefined) {
    if (id && confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuariosService.eliminarUsuario(id).subscribe({
        next: () => {
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          alert('Error al eliminar el usuario');
        }
      });
    }
  }
}
