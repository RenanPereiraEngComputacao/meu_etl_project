MEU_ETL_PROJECT

Projeto desenvolvido para ETL (Extract, Transform, Load) e integração entre banco de dados local e sistema ERP.
O sistema realiza atualização de clientes, produtos, estoque e pedidos, com interface frontend para acompanhamento em tempo real.

🚀 Funcionalidades
🔹 Backend (Python)

Atualizações automáticas de:

Clientes (att_clientes.py)

Produtos (att_produtos.py)

Estoque (att_estoque.py e att_estoque-desativada.py)

Sincronização de pedidos (sync_order.py)

Liberação de pedidos (libera_pedido.py)

Rotina de execução automática (rodarautomaticamente.py)

Scripts SQL para criação de banco e usuários:

createsql.sql

createuser.sql

createuserfrontend.sql

Conexão com múltiplos bancos MySQL/PostgreSQL:

Módulo DBconect

Módulo DBQueryes

Módulo DBtratament

🔹 Frontend (React + Node)

Dashboard para monitoramento das rotinas ETL.

Visualização de logs em tempo real.

Botões de execução manual dos scripts (exec.bat integrado).

Organização responsiva e moderna para acompanhamento administrativo.

🔹 Estrutura de Pastas
MEU_ETL_PROJECT/
│── backend/               # Scripts e módulos de backend
│── DBconect/              # Conexões com bancos de dados
│── DBQueryes/             # Consultas SQL organizadas
│── DBtratament/           # Tratamento e transformação dos dados
│── frontend/              # Interface em React para monitoramento
│── node_modules/          # Dependências do frontend
│── .env                   # Variáveis de ambiente
│── att_clientes.py        # Atualização de clientes
│── att_estoque.py         # Atualização de estoque
│── att_produtos.py        # Atualização de produtos
│── sync_order.py          # Sincronização de pedidos
│── rodarautomaticamente.py# Agendamento automático
│── libera_pedido.py       # Liberação de pedidos
│── exec.bat               # Execução rápida dos scripts
│── createsql.sql          # Criação do schema principal
│── createuser.sql         # Usuário do backend
│── createuserfrontend.sql # Usuário do frontend
│── package.json           # Configuração do frontend
│── README.md              # Documentação do projeto

⚙️ Tecnologias Utilizadas

Python 3.x

psycopg2 (PostgreSQL)

mysql-connector (MySQL)

pandas

logging

SQL (PostgreSQL e MySQL)

Node.js + React

Material UI

Axios

Express (para API auxiliar)

🔧 Como Rodar o Projeto
1️⃣ Clonar o repositório
git clone https://github.com/seuusuario/MEU_ETL_PROJECT.git
cd MEU_ETL_PROJECT

2️⃣ Configurar o Backend

Crie o arquivo .env na raiz com as variáveis de ambiente para conexão com os bancos:

DB_HOST=localhost
DB_USER=usuario
DB_PASS=senha
DB_NAME=seubanco


Instale dependências:

pip install -r requirements.txt


Execute um script manualmente, por exemplo:

python att_clientes.py

3️⃣ Configurar o Frontend
cd frontend
npm install
npm start


O dashboard abrirá em: http://localhost:3000

📊 Fluxo ETL

Extração: Leitura de dados de views/tabelas no banco ERP.

Transformação: Normalização, junção e agrupamento de dados no Python.

Carga: Atualização de tabelas auxiliares no PostgreSQL.

Sincronização: Pedidos são enviados ao ERP com controle de status.

🛠️ Melhorias Futuras

Logs centralizados no frontend.

Retry automático para falhas de rede (ex: erro 504 Gateway Timeout).

Controle de permissões por usuário no dashboard.

Testes unitários e de integração.
