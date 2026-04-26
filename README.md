//IA: pedi para o ChatGPT melhorar o meu README para que fique de uma forma facil de entender
# Quem é esse Pokémon?

## O Projeto
Este é um jogo mobile que foi desenvolvido em React Native. Inspirado em pokemon, o aplicativo gera um Pokémon aleatório e desafia o jogador a adivinhar seu nome através de um sistema de dicas (tipo, habilidade, tamanho e, a imagem). 

## API 
Os dados são consumidos da **[PokéAPI](https://pokeapi.co/)**, uma API RESTful pública e gratuita que fornece informações detalhadas sobre a franquia Pokémon.

## Funcionalidades 
- **Consumo de API e Sorteio Aleatório:** Busca de dados dinâmicos utilizando `fetch`, com uma lógica que garante que os Pokémon não se repitam sequencialmente, garantindo que o jogador não receba o mesmo pokemon seguidamente 
- **Dicas Progressivas:** Se o jogador errar o palpite, o jogo libera dicas:
  1. Tipos 
  2. Habilidade 
  3. Tamanho 
  4. Imagem 
- **Normalização de Input:** O texto digitado pelo jogador passa por uma função de limpeza para removendo acentos, letras maiúsculas e caracteres especiais, garantindo que a validação da resposta seja justa e precisa.
- **Tratamento de Estados:** Controle de estado usando `useState` e `useEffect`, cobrindo as fases de carregamento, exibição de dados e erros.
- **Feedback Visual:** Utilização de Modais para comunicar o resultado de cada rodada e uma tela final de pontuação.

## Componentes do React Native 
Para ir além do básico, o projeto explora a documentação utilizando os seguintes componentes:
- `SafeAreaView` e `ScrollView`: Para garantir que o conteúdo não sobreponha a barra de status e permita rolagem em telas menores.
- `KeyboardAvoidingView`: Evita que o teclado do dispositivo cubra o campo de `TextInput` durante o jogo.
- `Image`: Para renderizar as artes oficiais da PokéAPI.
- `TouchableOpacity` e `Pressable`: Para diferentes áreas de interação e botões.
- `ActivityIndicator`: Fornece feedback visual durante o tempo de resposta da API .
- `Modal`: Cria sobreposições na tela para exibir mensagens entre as rodadas sem mudar a navegação.

## Como Rodar o Projeto

1. Clone este repositório na sua máquina.
2. Acesse a pasta do projeto e instale as dependências executando:
   ```bash
   npm install
