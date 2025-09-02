import os
import json
import logging
import re
from flask import Flask, render_template, request, redirect, url_for, flash

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Load products data
def load_products():
    try:
        with open('data/products.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.error("Products file not found")
        return []

@app.route('/')
def index():
    """Homepage route"""
    return render_template('index.html')

@app.route('/listado_tabla')
def listado_tabla():
    """Product listing in table format"""
    products = load_products()
    return render_template('listado_tabla.html', products=products)

@app.route('/listado_box')
def listado_box():
    """Product listing in box/card format"""
    products = load_products()
    return render_template('listado_box.html', products=products)

@app.route('/producto/<int:product_id>')
def producto(product_id):
    """Individual product detail page"""
    products = load_products()
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        flash('Producto no encontrado', 'error')
        return redirect(url_for('listado_box'))
    return render_template('producto.html', product=product)

@app.route('/comprar', methods=['GET', 'POST'])
def comprar():
    """Purchase form page"""
    products = load_products()
    
    if request.method == 'POST':
        # Validate form data
        nombre = request.form.get('nombre', '').strip()
        direccion = request.form.get('direccion', '').strip()
        telefono = request.form.get('telefono', '').strip()
        email = request.form.get('email', '').strip()
        medio_pago = request.form.get('medio_pago', '')
        productos_seleccionados = request.form.getlist('productos[]')
        
        # Basic validation
        errors = []
        if not nombre:
            errors.append('El nombre es requerido')
        if not direccion:
            errors.append('La dirección es requerida')
        
        # Validate phone number
        if not telefono:
            errors.append('El teléfono es requerido')
        else:
            # Check if phone contains only allowed characters
            phone_pattern = re.compile(r'^[0-9\s\-\+\(\)]{8,15}$')
            numbers_only = re.sub(r'[^\d]', '', telefono)
            
            if not phone_pattern.match(telefono) or len(numbers_only) < 8 or len(numbers_only) > 15:
                errors.append('El teléfono debe contener solo números (8-15 dígitos)')
        
        # Validate email
        if not email:
            errors.append('El email es requerido')
        else:
            email_pattern = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
            if not email_pattern.match(email):
                errors.append('Ingrese un email válido')
        
        if not medio_pago:
            errors.append('El medio de pago es requerido')
        if not productos_seleccionados:
            errors.append('Debe seleccionar al menos un producto')
        
        if errors:
            for error in errors:
                flash(error, 'error')
        else:
            flash('¡Pedido enviado correctamente! Nos contactaremos con usted pronto.', 'success')
            return redirect(url_for('index'))
    
    return render_template('comprar.html', products=products)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
