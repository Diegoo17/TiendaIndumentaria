import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productoService/productos.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './agregar-producto.component.html',
  styleUrl: './agregar-producto.component.css'
})
export class AgregarProductoComponent implements OnInit {
  productoForm!: FormGroup;
  selectedFile: File | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService
  ) {}

  ngOnInit() {
    this.productoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      imagen: [null]
    });
  }

  get name() { return this.productoForm.get('name'); }
  get price() { return this.productoForm.get('price'); }
  get description() { return this.productoForm.get('description'); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.selectedFile = file;
    
    if (file && !file.type.startsWith('image/')) {
      alert('Por favor, selecciona solo archivos de imagen');
      event.target.value = '';
      this.selectedFile = null;
    }
  }

  async onSubmit() {
    this.submitted = true;
    console.log('Estado del formulario:', this.productoForm.value);
    console.log('Errores del formulario:', this.productoForm.errors);

    if (this.productoForm.invalid) {
      console.log('Formulario inválido');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.productoForm.get('name')?.value);
    formData.append('price', this.productoForm.get('price')?.value);
    formData.append('description', this.productoForm.get('description')?.value);
    
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    try {
      const response = await this.productosService.agregarProducto(formData).toPromise();
      console.log('Respuesta del servidor:', response);
      alert('Producto agregado correctamente');
      this.productoForm.reset();
      this.submitted = false;
      this.selectedFile = null;
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al agregar el producto');
    }
  }
}