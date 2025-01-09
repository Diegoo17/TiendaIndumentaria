import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule, FormControl } from '@angular/forms';
import { ProductosService } from '../../services/productoService/productos.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './agregar-producto.component.html',
  styleUrl: './agregar-producto.component.css'
})
export class AgregarProductoComponent implements OnInit {
  productoForm!: FormGroup;
  selectedFile: File | null = null;
  submitted = false;
  tallesDisponibles = ['S', 'M', 'L', 'XL']; 

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService
  ) {}

  ngOnInit() {
    this.productoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      imagen: [null],
      talles: this.fb.array([], Validators.required) 
    });
  }

  get tallesFormArray(): FormArray {
    return this.productoForm.get('talles') as FormArray;
  }

  get name() { return this.productoForm.get('name'); }
  get price() { return this.productoForm.get('price'); }
  get description() { return this.productoForm.get('description'); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.selectedFile = file;
    
    if (file && !file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Archivo no válido',
        text: 'Por favor, selecciona solo archivos de imagen.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    
      event.target.value = ''; 
      this.selectedFile = null; 
    }
  }

  async onSubmit() {
    this.submitted = true;
  
    if (this.productoForm.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Revisa los datos ingresados.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  
    const formData = new FormData();
    formData.append('name', this.productoForm.get('name')?.value);
    formData.append('price', this.productoForm.get('price')?.value);
    formData.append('description', this.productoForm.get('description')?.value);
    formData.append('talles', JSON.stringify(this.productoForm.get('talles')?.value));
  
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }
  
    console.log('FormData enviado:', formData);
  
    this.productosService.agregarProducto(formData).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Producto agregado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.productoForm.reset();
          this.submitted = false;
          this.selectedFile = null;
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudo registrar el producto. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
        console.error('Error:', error);
      }
    });
  }

  
  onTalleChange(event: any) {
    const talle = event.target.value;
  
    if (event.target.checked) {
      // Agrega un nuevo FormGroup con size y stock al FormArray
      this.tallesFormArray.push(
        this.fb.group({
          size: [talle, Validators.required],
          stock: [0, [Validators.required, Validators.min(0)]] // Control para el stock
        })
      );
    } else {
      // Elimina el FormGroup correspondiente al talle deseleccionado
      const index = this.tallesFormArray.controls.findIndex(
        (control) => control.get('size')?.value === talle
      );
      if (index !== -1) {
        this.tallesFormArray.removeAt(index);
      }
    }
  }
  getStockControl(index: number): FormControl {
    return this.tallesFormArray.at(index).get('stock') as FormControl;
  }
  
  
}