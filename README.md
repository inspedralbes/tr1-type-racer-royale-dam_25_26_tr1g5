# 🧠 **FitCam**
<img width="420" height="420" alt="FitCam logo" src="https://github.com/user-attachments/assets/c202c189-35e1-415a-ae4e-ff883b16dbd9" />

---

## 👥 **Membres de l’equip**
- **Eduard Vilaseca**  
- **Aymar Ramos**  
- **Biel Calvet**  
- **Fabrizzio Rodríguez**

---

## 💡 **Descripció del projecte**
**FitCam** és una aplicació web interactiva que combina **intel·ligència artificial** i **visió per computador** per millorar els entrenaments físics de manera dinàmica i entretinguda.  

L’usuari pot:
- **Crear una sala** o **unir-se a una sala existent**.  
- Escollir els **exercicis** que vol realitzar.  
- Seguir un **vídeo explicatiu** mentre la seva **webcam analitza els moviments** per valorar la precisió i la tècnica.  

En finalitzar la sessió, FitCam mostra:
- Una **puntuació final** basada en la qualitat dels moviments.  
- Un **rànquing amb el Top 3** participants de la sala.  

🎯 L’objectiu és oferir una experiència d’entrenament **gamificada, social i personalitzada**, accessible directament des del navegador.

---

## 🧩 **Tecnologies principals**

| Àmbit | Eines i tecnologies |
|-------|----------------------|
| **Frontend** | Vue 3 + Vite |
| **Backend** | Node.js + Express |
| **Base de dades** | MySQL + Sequelize |
| **IA / Visió per computador** | TensorFlow.js + MediaPipe (detecció de postura) |
| **Autenticació i API** | JWT + REST API |
| **Deploy** | Docker + servidor de l’Institut Pedralbes |

---

## 🗂️ **Estructura mínima del projecte**
<img width="401" height="609" alt="Project structure" src="https://github.com/user-attachments/assets/e73eed05-c6c3-4109-a051-7cb24ca680ab" />

### ⚙️ **Configuració i execució del projecte**

```bash
# Clonar el repositori

git clone https://github.com//inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g5

-----------------------------------------------------------

# 1. Frontend
# Instal·lació de dependències si no estan instal·lades

npm install

# Iniciar l'entorn de desenvolupament

npm run dev

#El frontend s’executarà habitualment a:
#http://localhost:3000

-----------------------------------------------------------

# 2. Backend

# Instal·lació de dependències
npm install

# Executar servidor

node server.js

#El servidor del backend s’executarà habitualment a:
#http://localhost:3001

-----------------------------------------------------------

# 3. Docker

# Si vols aixecar tot el projecte amb Docker Compose, pots fer-ho directament des de l’arrel del repositori:

docker compose up -d

# Això crearà i aixecarà automàticament els contenidors de frontend, backend i base de dades, permetent executar tot l’entorn de desenvolupament amb una sola comanda.
```
---

## 📋 **Gestió del projecte**
**Eina utilitzada:** [Taiga](https://tree.taiga.io/project/a24biecalcol-dam2_proj1/timeline)

---

## 🎨 **Prototip gràfic**
**Penpot:** [👉 Obrir el disseny](https://design.penpot.app/#/view?file-id=5b786374-066f-8104-8007-048a32a15967&page-id=5b786374-066f-8104-8007-048a32a18227&section=interactions&index=0&share-id=5b786374-066f-8104-8007-049649ccb737)

---

## 🌐 **URL de producció**
[https://fitcam.dam.inspedralbes.cat](https://fitcam5.dam.inspedralbes.cat)

---

## 🚀 **Estat actual del projecte**
🟢 *Acabat*  

---

## 🔮 **Properes fites**
- Integració del reconeixement de moviments amb **TensorFlow.js**  
- Sistema de **login i registre d’usuaris**  
- Creació de la **pantalla de resultats** i rànquing en temps real  
- Desplegament complet amb **Docker**

---

## 🧾 **Llicència**
Projecte acadèmic desenvolupat dins del mòdul de **Projectes Transversals - 2n DAM (Institut Pedralbes)**.  
No destinat a ús comercial.
