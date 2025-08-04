en principio los datos que se obtienen desde datos abiertos tienen este formato
```
indice_tiempo,idempresa,cuit,empresa,direccion,localidad,provincia,region,idproducto,producto,idtipohorario,tipohorario,precio,fecha_vigencia,idempresabandera,empresabandera,latitud,longitud,geojson
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,19,Gas Oil Grado 2,2,Diurno,1338,2025-06-21 09:41:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,19,Gas Oil Grado 2,3,Nocturno,1338,2025-06-21 09:41:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,21,Gas Oil Grado 3,2,Diurno,1552,2025-06-21 09:41:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,21,Gas Oil Grado 3,3,Nocturno,1552,2025-06-21 09:41:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-05,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,6,GNC,2,Diurno,499.9,2025-05-30 12:05:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-05,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,6,GNC,3,Nocturno,499.9,2025-05-30 12:05:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,3,Nafta (premium) de más de 95 Ron,2,Diurno,1617,2025-06-21 09:42:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,3,Nafta (premium) de más de 95 Ron,3,Nocturno,1617,2025-06-21 09:42:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,2,Nafta (súper) entre 92 y 95 Ron,2,Diurno,1340,2025-06-21 09:42:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-06,1376,33-64337382-9,10 DE SETIEMBRE S.A.,Av. Mosconi 299,LOMAS DEL MIRADOR,BUENOS AIRES,PAMPEANA,2,Nafta (súper) entre 92 y 95 Ron,3,Nocturno,1340,2025-06-21 09:42:00,28,PUMA,-34.658476,-58.529443,"{""type"":""Point"",""coordinates"":[-58.529443,-34.658476]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,19,Gas Oil Grado 2,2,Diurno,1236,2025-05-08 09:23:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,19,Gas Oil Grado 2,3,Nocturno,1236,2025-05-08 09:23:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,21,Gas Oil Grado 3,2,Diurno,1480,2025-05-08 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,21,Gas Oil Grado 3,3,Nocturno,1480,2025-05-08 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,3,Nafta (premium) de más de 95 Ron,2,Diurno,1220,2025-05-26 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,3,Nafta (premium) de más de 95 Ron,3,Nocturno,1220,2025-05-26 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,2,Nafta (súper) entre 92 y 95 Ron,2,Diurno,1026,2025-05-08 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,10677,30-71752323-3,1263 S.R.L.,UTA NAC. 3 KM. 1258 (COLECTORA CALLE 102 Nº 321) 321,SIERRA GRANDE,RIO NEGRO,,2,Nafta (súper) entre 92 y 95 Ron,3,Nocturno,1026,2025-05-08 09:24:00,28,PUMA,-41.60707,-65.35383,"{""type"":""Point"",""coordinates"":[-65.35383,-41.60707]}"
2025-05,8943,30-71251168-7,1913 SRL,JULIO A ROCA 715,GOBERNADOR COSTA,CHUBUT,PATAGONIA,19,Gas Oil Grado 2,2,Diurno,1220,2025-05-08 12:59:00,28,PUMA,-44.050662,-70.583041,"{""type"":""Point"",""coordinates"":[-70.583041,-44.050662]}"

```
y se obtienen desde esta url 'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv' a partir de estos datos se debe proponer un modelo de datos acorde que los represente.  por otro lado el modelo da datos de usuarios se infiere de better auth en @better-auth-schema.ts.

sobre este modelo lo que pretendo es que los usuarios puedan reportar el precio de los combustibles de forma libre, cualquier usuario puede indicar el precio que tiene un tipo de combustible en una estacion de servicio.

estos precios se deben mostrar como precios aportados por los usuarios, cohexistiendo con los precios que vienen de datos abiertos, ya que los precios de datos abiertos son los precios vigentes, y los precios aportados por los usuarios son precios propuestos por los usuarios.

En teoria las estaciones de servicio estan obligadas a informar diariamente el informe de sus precios, pero no todas las estaciones cumplen con esta obligacion, por eso esta la idea de que los usuarios puedan reportar el precio de los combustibles de forma libre.

Se prevee que a futuro pueda existir un tipo de usuario que sea "validado" de alguna forma tal que les permita reportar precios de sus combustibles de forma oficial, estos precios aportados van a tener un peso mayor en la lista de precios, y por lo tanto seran los precios destacados en la ui.

En cualquier otro caso los precios destacados en la ui serán los precios obtenidos de datos abiertos, siempre pudiendo ver los precios aportados por los usuarios, siempre pudiendo ver los mas actuales.

Es importante asumir que en argentina los precios de los combustibles no se mantienen de forma estatica, sino que varian por la inflación.

Los precios de los combustibles suman la posibilidad de aplicar a diurno o nocturno, ya que ahora pueden haber diferencias en los precios de acuerdo al horario en el que uno vaya a cargar combustible

Por otro lado debe existir un proceso que descargue diariamente los precios de los combustibles y los actualice en la bd, siempre dejando el precio con la ultima fecha de como el precio vigente, y solamente almacenando un incremental de precios de cada tipo de combustible en cada estacion.

Este proceso de descarga de precios estan pesando para ejecutarse por fuera de la infraestructura de deploy de la aplicacion (en vercel) y este será un script que acceda directamente al modelo de datos impactando directamente en la base de datos con los precios descargados.

desde el punto de vista de la ui lo que se pretende es una interface de mapa con openstreetmap sobre la cual los usuarios sean automáticamente georeferenciados y muestre los precios de los combustibles en un radio de distancia configurable desde donde se los posicione en el mapa.

Ademas los usuarios van a poder buscar un punto en el mapa a traves de un buscador de direcciones, una vez seleccionado el punto se podra mostrar los precios de los combustibles en un radio de distancia configurable desde donde se los posicione en el mapa.

En argentina existen 5 tipos de combustibles
- Nafta
- Nafta premium
- Gasoil
- Gasoil premium
- GNC

Ademas del mapa la ui debe permitir una url para cada estacion de servicio, la cual esta pensada para ser indexada por google y mostrar los precios de combustibles de la estacion de servicio y un historial de precios de combustibles de la estacion de servicio.  mostrar un mapa con la ubicación de la estacion.  Estas paginas de detalle de cada estacion de servicio debe ser indexadas por google, por lo tanto se debe contemplar el uso de metatags y otros elementos que permitan que google indexe estas paginas.  Es importante el renderizado del lado del servidor para que google pueda indexar estas paginas (aprovechar las ventajas de next.js para ssr)
