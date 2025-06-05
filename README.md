# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0720ccc6-66c4-42dc-9703-84dd13d0cab1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0720ccc6-66c4-42dc-9703-84dd13d0cab1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0720ccc6-66c4-42dc-9703-84dd13d0cab1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Eco Admin Vista

Sistema de administração para e-commerce com recursos de gestão de produtos, transferências entre bodegas, e controle de estoque.

## Funcionalidades

- 🔐 Autenticação segura com JWT
- 📦 Gestão completa de produtos
- 🏪 Controle de transferências entre bodegas
- 📊 Dashboard com estatísticas
- 🔄 Logout automático em caso de sessão expirada

## Autenticação e Sessão

### Logout Automático em Caso de Token Expirado

O sistema implementa um mecanismo robusto para lidar com tokens expirados:

1. **Interceptor Axios**: Detecta automaticamente erros 401 e tenta reautenticar usando credenciais salvas
2. **Fallback de Logout**: Se a reautenticação falhar, faz logout automático do usuário
3. **Função authenticatedFetch**: Para chamadas fetch manuais, também detecta 401 e faz logout

#### Como Funciona

Quando uma requisição retorna erro 401:
1. O sistema tenta reautenticar automaticamente usando as credenciais salvas
2. Se a reautenticação for bem-sucedida, a requisição original é refeita com o novo token
3. Se falhar, o usuário é automaticamente deslogado e redirecionado para a tela de login
4. Todos os dados de autenticação são limpos do localStorage e sessionStorage

#### Para Desenvolvedores

**Para chamadas com Axios (recomendado):**
```typescript
import { api } from '@/api/api';
// O interceptor cuida automaticamente dos erros 401
const response = await api.get('/rest/V1/products');
```

**Para chamadas fetch manuais:**
```typescript
import { authenticatedFetch } from '@/api/apiConfig';
// Esta função adiciona o token automaticamente e trata erros 401
const response = await authenticatedFetch('https://api.exemplo.com/dados');
```
