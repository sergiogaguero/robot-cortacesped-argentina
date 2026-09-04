---
title: "Cámara con IA vs RTK vs LiDAR en robots cortacésped"
description: "Cómo navegan los robots cortacésped sin cable perimetral: cámara con IA, RTK y LiDAR comparados en instalación, precisión, límites y costo."
pubDate: 2026-09-17
cover: "./camara-ia-vs-rtk-vs-lidar-robot-cortacesped.jpg"
coverAlt: "Robot cortacésped mapeando un jardín con sus cámaras"
tags: ["tecnología", "comparativa"]
relatedProducts: ["v1000"]
draft: false
---

Durante veinte años, "robot cortacésped" significó lo mismo para todo el mundo: enterrar un cable alrededor del jardín, marcar el límite y esperar que el robot no se lo saltee. Hoy esa etapa quedó atrás. Hay tres formas distintas de que un robot sepa dónde puede cortar sin cable enterrado, y no son equivalentes entre sí — cada una resuelve el problema con una tecnología diferente, y cada una tiene un punto donde se queda corta. Este artículo las compara sin marketing, con las ventajas y los límites reales de cada una.

## El problema que todos resuelven: saber dónde está el césped

El cable perimetral funcionaba como un límite eléctrico: una corriente de baja intensidad que el robot detectaba con una antena y usaba como frontera. Del otro lado del cable, no había información — solo un límite que no cruzar. Funcionaba, pero traía problemas conocidos por cualquiera que instaló uno: la obra de enterrarlo a mano alrededor de todo el jardín, los cortes del cable por una pala, una raíz o el propio corte del pasto, y la imposibilidad de cambiar el diseño del jardín sin volver a cavar. Y había un problema de fondo: el robot no "veía" nada. Solo sabía dónde estaba el límite, no qué había dentro. Si un juguete o una manguera quedaban en el medio, el robot los chocaba.

Las tres tecnologías que reemplazaron al cable — RTK, LiDAR y cámara con inteligencia artificial — resuelven la misma pregunta de fondo, "¿dónde estoy y hasta dónde puedo cortar?", pero de maneras muy distintas, con distinta precisión, distintos límites y distinto costo.

## RTK: GPS de precisión centimétrica

RTK (Real-Time Kinematic) es una variante de GPS de alta precisión. El robot lleva un receptor satelital, pero en vez de conformarse con la precisión típica del GPS de un teléfono (varios metros de margen), recibe una corrección en tiempo real desde una antena de referencia fija que se instala en el jardín. Con esa corrección, la posición del robot se calcula con un margen del orden de 2-3 cm en condiciones ideales — suficiente para trazar líneas de corte prolijas sin cable de por medio.

El límite concreto de RTK es la señal satelital: pierde precisión bajo árboles frondosos, cerca de paredes altas o techos que tapan buena parte del cielo, y ahí el robot se detiene o se desvía de la ruta planeada. Además, la antena de referencia necesita instalarse en un lugar con cielo despejado y alimentación eléctrica propia, lo que suma un paso más a la instalación. Y como el RTK solo resuelve la posición, no la visión, el robot no detecta obstáculos por sí mismo: necesita sensores adicionales, generalmente ultrasonido o una cámara básica, para no chocar lo que se cruza en el camino. RTK tiene sentido para jardines abiertos, sin árboles, grandes.

## LiDAR: el sensor de los autos autónomos

LiDAR es el mismo tipo de sensor que usan muchos autos autónomos: emite pulsos de láser, mide cuánto tardan en rebotar contra cada superficie y arma un mapa tridimensional del entorno en tiempo real. La ventaja central es que no depende de la luz ni del cielo abierto: funciona de noche igual que de día, y no le importa si hay árboles tapando la vista hacia arriba.

El límite del LiDAR está en lo que mide y en lo que no. Mide distancias y formas, no significado: no distingue césped de tierra o de un cantero bajo, porque para el láser todo es una superficie a determinada distancia. También es sensible a lluvia intensa y polvo en el aire, que interfieren con el rebote del láser, y en muchos modelos es un componente caro, con partes móviles que giran para barrer el entorno. En jardines muy abiertos, sin referencias verticales como paredes o árboles, puede perder posición porque no tiene contra qué "engancharse" para ubicarse. LiDAR es una opción para jardines con muchas estructuras y presupuesto alto.

## Cámara con IA: el robot que ve

La tercera vía es la cámara con inteligencia artificial: varias cámaras alrededor del robot alimentan un modelo de visión entrenado específicamente para reconocer césped, bordes, caminos, obstáculos, personas y mascotas. La diferencia de fondo con RTK y LiDAR es que la cámara no solo calcula posición: entiende *qué* es cada cosa, no solo *dónde* está.

Eso trae ventajas prácticas. La instalación es mínima — no hace falta cable enterrado ni antena de referencia, solo ubicar la base de carga. Como reconoce césped y no un límite fijo, se adapta si más adelante cambiás el diseño del jardín, sin obra. Y detecta obstáculos chicos con los que RTK y LiDAR suelen tener problemas: juguetes, mangueras, hasta un erizo parado en el pasto. TerraMow, por ejemplo, usa este enfoque en su V Series: tres cámaras trabajando en conjunto con un sistema propio, TerraVision 2.0, entrenado para reconocer el entorno de un jardín.

Pero la cámara también tiene límites que conviene decir con la misma honestidad. Necesita luz para funcionar: no trabaja de noche cerrada, aunque sí se maneja bien al atardecer o con luz de patio encendida. Los lentes se ensucian con tierra, rocío o pasto cortado, así que hay que limpiarlos cada tanto. Y en un césped extremadamente uniforme, sin bordes visibles que marquen dónde termina el pasto, puede necesitar que delimites algunas zonas manualmente desde la app la primera vez, hasta que el mapa quede afinado.

## Comparativa

| | Cámara con IA | RTK | LiDAR |
| --- | --- | --- | --- |
| Instalación | Ninguna | Antena fija, cielo abierto | Ninguna |
| Obra en el jardín | No | No | No |
| Funciona bajo árboles | Sí | No o mal | Sí |
| Funciona de noche | No | Sí | Sí |
| Reconoce césped vs no-césped | Sí | No | No |
| Detecta obstáculos chicos | Sí | Depende de sensores extra | Parcial |
| Cambiar el diseño del jardín | Remapear desde la app | Remapear | Remapear |
| Sensibilidad a lluvia fuerte | Media | Baja | Alta |
| Costo relativo | Medio | Medio-alto por la antena | Alto |

## Cuál conviene según tu jardín

- **Jardín con árboles y canteros**: la cámara es la opción con menos puntos débiles, porque no depende del cielo abierto que necesita el RTK.
- **Campo abierto enorme, sin sombra**: ahí el RTK puede rendir bien, con buena señal satelital todo el tiempo.
- **Querés cortar de noche sí o sí**: LiDAR o RTK son las únicas opciones, porque la cámara necesita luz.
- **Querés instalar en 20 minutos y olvidarte**: la cámara gana por instalación mínima, sin antena ni obra.

Para el jardín típico argentino — entre 300 y 1200 m², con árboles, quincho y a veces pileta — la cámara con IA es la opción con menos fricción.

## Conclusión

Ninguna de las tres tecnologías es perfecta en todos los escenarios, pero para el jardín residencial promedio en Argentina, con sombra de árboles, algún cantero y ganas de instalar el equipo una sola vez, la cámara con IA es la que menos concesiones pide: sin obra, sin antena y con la capacidad de distinguir césped de lo que no lo es. Si querés ver en detalle cómo funciona el mapeo y el ciclo de trabajo día a día, la [guía de tecnología](/tecnologia) lo explica paso a paso, y si ya estás mirando modelos, el [TerraMow V1000](/productos/v1000) es el equipo pensado para jardines más grandes — la comparativa [V600 vs V1000](/productos/v600-vs-v1000) te ayuda a elegir según los metros cuadrados de tu jardín. Cualquier duda puntual sobre tu caso, escribinos por WhatsApp y te respondemos directo.
