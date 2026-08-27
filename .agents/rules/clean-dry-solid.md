---
name: clean-dry-solid-rules
description: Enforces CLEAN, DRY, and SOLID principles, deep documentation, file segmentation, human readability, and AI-optimized coding patterns.
---

# Reglas de Desarrollo para Agentes: CLEAN, DRY, SOLID, Documentación y Legibilidad (Humano/IA)

Estas reglas definen los estándares de calidad de código y diseño de software para todas las tareas de programación en este espacio de trabajo. Todos los agentes de IA y colaboradores humanos **DEBEN** adherirse estrictamente a estas directrices.

---

## 1. Principios de Diseño de Software

### CLEAN (Código Limpio)
*   **Nombres Significativos:** Usa nombres auto-descriptivos para variables, funciones y clases. Evita abreviaciones confusas.
    *   *Clases/Entidades:* Sustantivos (ej. `UserProfileManager`, `InvoiceRepository`).
    *   *Funciones/Métodos:* Verbos (ej. `calculateTotalAmount`, `fetchUserData`).
*   **Funciones Pequeñas y Enfocadas:** Cada función debe realizar una única tarea y tener un nivel de abstracción uniforme. Lo ideal es que no superen las 30 líneas de código.
*   **Evita Efectos Secundarios:** Las funciones deben ser lo más puras posible. Si modifican algún estado externo, esto debe quedar explícitamente documentado.
*   **Formato Consistente:** Respeta las reglas de indentación, espaciado y estructura de archivos del proyecto.

### DRY (Don't Repeat Yourself)
*   **Abstracción de Lógica Común:** No dupliques código. Si una misma lógica o cálculo se repite más de dos veces, extráela a una función utilitaria, un hook personalizado (en React/Next.js) o una clase base.
*   **Fuente Única de Verdad (SSOT):** Configura constantes, rutas, esquemas de bases de datos y tipos de TypeScript en un solo lugar y expórtalos donde sea necesario.

### SOLID
*   **S - Single Responsibility Principle (Responsabilidad Única):** Una clase o componente debe tener una, y solo una, razón para cambiar. Divide componentes grandes en sub-componentes más pequeños.
*   **O - Open/Closed Principle (Abierto/Cerrado):** El software debe estar abierto para la extensión pero cerrado para la modificación. Utiliza polimorfismo, interfaces y composición en lugar de bloques masivos de `if/else` o `switch`.
*   **L - Liskov Substitution Principle (Sustitución de Liskov):** Las clases derivadas deben poder sustituir a sus clases base sin alterar el comportamiento correcto del programa.
*   **I - Interface Segregation Principle (Segregación de Interfaces):** Es mejor tener muchas interfaces específicas que una sola interfaz de propósito general. No obligues al código a depender de métodos que no utiliza.
*   **D - Dependency Inversion Principle (Inversión de Dependencias):** Depende de abstracciones (interfaces), no de implementaciones concretas. Usa inyección de dependencias o patrones de proveedores cuando sea apropiado.

---

## 2. Documentación Exhaustiva

Todo el código debe estar fuertemente documentado usando formatos estándar como **JSDoc/TSDoc** para TypeScript/JavaScript:

### Encabezados de Archivo
Cada archivo nuevo o modificado significativamente debe iniciar con un bloque de comentario que describa su rol en el sistema:
```typescript
/**
 * @file UserProfileCard.tsx
 * @description Componente de presentación para mostrar y editar la información de perfil del usuario.
 * @module components/user
 * @see {@link module:hooks/useUserProfile} para la lógica de estado asociada.
 */
```

### Documentación de Funciones y Clases
Cada clase, interfaz, método y función exportada debe documentar sus parámetros, tipos de retorno y excepciones:
```typescript
/**
 * Calcula el impuesto total aplicable a una orden basándose en el estado de residencia.
 *
 * @param {number} subtotal - El costo neto de los artículos de la orden.
 * @param {string} stateCode - El código postal de dos dígitos del estado (ej. 'MX', 'TX').
 * @returns {number} El monto del impuesto calculado.
 * @throws {InvalidStateError} Si el código de estado no está soportado.
 */
function calculateTax(subtotal: number, stateCode: string): number { ... }
```

### Comentarios de Bloque Explicativos
No documentes *qué* hace el código si es obvio por su nombre; documenta el **porqué (la intención)** detrás de decisiones complejas, optimizaciones o algoritmos no triviales.

---

## 3. Segmentación y Estructuración de Archivos

### Organización del Proyecto
*   **Separación de Preocupaciones:** Mantén la lógica de negocio (servicios/hooks), la lógica de presentación (componentes de UI) y las definiciones de tipos en archivos separados.
*   **Estructura de Componentes:** Si un componente de React/Next.js requiere estilos específicos o hooks privados, colócalo en su propia carpeta:
    ```
    /components/MyComponent/
    ├── MyComponent.tsx       # Componente principal
    ├── MyComponent.styles.ts  # Estilos locales (si aplica)
    ├── useMyComponent.ts     # Hook con la lógica de estado local
    └── types.ts              # Tipos específicos del componente
    ```

### Estructura Interna del Archivo
Agrupa y segmenta el contenido del archivo de forma ordenada:
1.  Imports externos (librerías y frameworks).
2.  Imports internos (componentes locales, utilidades, tipos).
3.  Interfaces y Tipos de TypeScript.
4.  Constantes locales.
5.  Componente/Clase Principal (exportado por defecto o de forma nombrada).
6.  Sub-componentes u funciones auxiliares internas.

Usa separadores visuales si el archivo supera las 150 líneas:
```typescript
// ============================================================================
// HELPERS & UTILS
// ============================================================================
```

---

## 4. Legibilidad Humana y Optimización para IA

El código debe estar optimizado tanto para que un desarrollador humano lo entienda al instante, como para que los Modelos de Lenguaje (LLMs) lo procesen sin ambigüedades.

### Legibilidad Humana
*   **Código Autodocumentado:** El código limpio debe explicarse por sí mismo. Prefiere variables intermedias legibles antes que una línea de código extremadamente densa.
*   **Espaciado:** Agrupa líneas de código relacionadas y sepáralas de otros bloques usando líneas en blanco para representar pasos lógicos.
*   **Evita la Anidación Excesiva (Anti-Pattern: Arrow Code):** Utiliza cláusulas de guarda (*guard clauses*) para retornar temprano de las funciones y evitar múltiples niveles de `if` anidados.

### Optimización para Lectura de IA
*   **Tipado Estricto:** Usa TypeScript de manera rigurosa. Evita el uso de `any`. Define tipos específicos para entradas, salidas y payloads. Las declaraciones explícitas ayudan a la IA a deducir el contexto y autocompletar de manera precisa.
*   **Estructuras Predecibles:** Evita patrones demasiado "trucosos" o mágicos en el lenguaje. Prefiere la claridad y las convenciones estándar del framework.
*   **Etiquetas de Contexto Semántico:** Para algoritmos complejos o flujos asíncronos complejos, añade comentarios con tags que indiquen la arquitectura, patrón o principio SOLID utilizado (ej. `// [SOLID:SRP] Extraído para aislar la llamada de API`).
*   **Anotación de Dependencias:** Si un archivo depende críticamente de otro o de un estado global específico, indícalo de manera explícitamente en la documentación inicial del archivo (`@see` o `@requires`).

---

## 5. Ejemplos de Referencia

### ❌ Mal Ejemplo (Incumple SOLID, DRY, CLEAN, y sin documentación)
```typescript
// Archivo: utils.ts
export function handle(u: any, items: any[]) {
  let total = 0;
  for(let i=0; i<items.length; i++) {
    if(items[i].active == true) {
      if(items[i].price > 100) {
        total += items[i].price * 0.9;
      } else {
        total += items[i].price;
      }
    }
  }
  if(u.role == 'admin') {
    total = total * 0.95;
  }
  // enviar email
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/notify");
  xhr.send(JSON.stringify({ user: u.email, amount: total }));
  return total;
}
```

###  Buen Ejemplo (Aplica CLEAN, DRY, SOLID, Documentado y Optimizado para IA)
```typescript
/**
 * @file orderDiscountService.ts
 * @description Servicio encargado de calcular subtotales de órdenes con descuentos aplicados y notificar transacciones.
 * @module services/order
 */

import { User, OrderItem } from '@/types/models';

interface DiscountRules {
  minPriceForDiscount: number;
  bulkDiscountRate: number;
  adminDiscountRate: number;
}

const DISCOUNT_CONFIG: DiscountRules = {
  minPriceForDiscount: 100,
  bulkDiscountRate: 0.90, // 10% de descuento
  adminDiscountRate: 0.95, // 5% de descuento adicional
};

/**
 * Calcula el precio final con descuento para un ítem individual de la orden.
 * [SOLID:SRP] Responsable únicamente de calcular el precio unitario aplicando descuentos por volumen.
 */
function calculateItemFinalPrice(item: OrderItem): number {
  if (!item.active) return 0;
  
  return item.price > DISCOUNT_CONFIG.minPriceForDiscount
    ? item.price * DISCOUNT_CONFIG.bulkDiscountRate
    : item.price;
}

/**
 * Calcula el total de una orden para un usuario específico, aplicando reglas de negocio y descuentos por rol.
 * 
 * @param {User} user - El usuario que realiza la compra.
 * @param {OrderItem[]} items - Lista de artículos incluidos en la transacción.
 * @returns {number} El total neto calculado para la orden.
 */
export function calculateOrderTotal(user: User, items: OrderItem[]): number {
  // 1. Calcular el subtotal acumulando el costo procesado de cada ítem
  const subtotal = items.reduce((accumulated, item) => {
    return accumulated + calculateItemFinalPrice(item);
  }, 0);

  // 2. Aplicar descuento especial por rol de administrador
  const isAdmin = user.role === 'admin';
  return isAdmin ? subtotal * DISCOUNT_CONFIG.adminDiscountRate : subtotal;
}

/**
 * Envía una notificación HTTP con los datos de la orden procesada.
 * [SOLID:SRP] Aísla la responsabilidad de comunicación de red.
 * 
 * @param {string} email - Correo del usuario destinatario.
 * @param {number} totalAmount - Monto final de la transacción.
 * @returns {Promise<void>}
 */
export async function sendOrderNotification(email: string, totalAmount: number): Promise<void> {
  const payload = JSON.stringify({ email, amount: totalAmount });
  
  const response = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`Failed to send order notification: ${response.statusText}`);
  }
}
```
