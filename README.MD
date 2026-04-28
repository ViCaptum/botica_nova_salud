# GUÍA PARA CLONAR EL PROYECTO: BOTICA NOVA SALUD

Sigue estos pasos en orden para tener el proyecto funcionando en tu computadora:

#### 1. CLONAR EL REPOSITORIO
Abre la terminal en la carpeta donde quieras guardar el proyecto y escribe:
```bash
git clone https://github.com/ViCaptum/botica_nova_salud.git
```

#### 2. INSTALAR LIBRERÍAS (DEPENDENCIAS)

Como no subimos la carpeta node_modules, debes descargarla con este comando:
```bash
npm install
```

#### 3. CONFIGURAR VARIABLES DE ENTORNO (.env)
Crea un archivo nuevo llamado exactamente ".env" en la carpeta raíz y pega esto:
```env
DB_HOST=localhost
DB_USER=root 
DB_PASSWORD=
DB_NAME=botica_nova_salud
DB_PORT=3306
```

#### 4. BASE DE DATOS
- Abre XAMPP y activa Apache y MySQL.
- Crea la base de datos "botica_nova_salud".
- Importa o ejecuta los scripts SQL de las tablas y las vistas.

#### 5. ARRANCAR EL SERVIDOR
Para encender el backend, usa:
```bash
npm start
```
O para no tener que apagar y prender a cada rato:
```bash
npm run dev
```