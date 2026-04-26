import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const TOTAL_ROUNDS = 10;
const MAX_POKEMON_ID = 1025;
const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';

const TYPE_TRANSLATIONS = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  grass: 'Planta',
  electric: 'Elétrico',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Venenoso',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  dark: 'Sombrio',
  steel: 'Aço',
  fairy: 'Fada',
};

//IA: pedi ajuda para o chatGPT de como colocar as cores junto aos tipos
const TYPE_COLORS = {
  Normal: '#A8A77A',
  Fogo: '#EE8130',
  Água: '#6390F0',
  Planta: '#7AC74C',
  Elétrico: '#F7D02C',
  Gelo: '#96D9D6',
  Lutador: '#C22E28',
  Venenoso: '#A33EA1',
  Terra: '#E2BF65',
  Voador: '#A98FF3',
  Psíquico: '#F95587',
  Inseto: '#A6B91A',
  Pedra: '#B6A136',
  Fantasma: '#735797',
  Dragão: '#6F35FC',
  Sombrio: '#705746',
  Aço: '#B7B7CE',
  Fada: '#D685AD',
};

function formatName(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizePokemonName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getSizeCategory(heightInDecimeters) {
  const meters = heightInDecimeters / 10;

  if (meters < 0.8) {
    return 'Pequeno';
  }

  if (meters < 1.7) {
    return 'Médio';
  }

  if (meters < 3) {
    return 'Grande';
  }

  return 'Colossal';
}

function preparePokemonData(data) {
  const types = data.types.map((item) => {
    const typeName = item.type.name;
    return TYPE_TRANSLATIONS[typeName] || formatName(typeName);
  });

  const abilities = data.abilities.map((item) => formatName(item.ability.name));

  const image =
    data.sprites?.other?.['official-artwork']?.front_default ||
    data.sprites?.other?.home?.front_default ||
    data.sprites?.front_default;

  const acceptedAnswers = [
    normalizePokemonName(data.name),
    normalizePokemonName(data.species?.name || ''),
  ].filter(Boolean);

  return {
    id: data.id,
    name: data.name,
    displayName: formatName(data.name),
    types,
    ability: abilities[0] || 'Habilidade desconhecida',
    sizeCategory: getSizeCategory(data.height),
    image,
    acceptedAnswers: Array.from(new Set(acceptedAnswers)),
  };
}

export default function App() {
  const usedPokemonIds = useRef(new Set());

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [pokemon, setPokemon] = useState(null);
  const [guess, setGuess] = useState('');
  const [clueStage, setClueStage] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    title: '',
    message: '',
    correct: false,
  });

  const getRandomPokemonId = () => {
    let randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;

    while (
      usedPokemonIds.current.has(randomId) &&
      usedPokemonIds.current.size < MAX_POKEMON_ID
    ) {
      randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
    }

    usedPokemonIds.current.add(randomId);
    return randomId;
  };

  const loadRandomPokemon = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setPokemon(null);
      setGuess('');
      setFeedback('');
      setClueStage(0);

      const pokemonId = getRandomPokemonId();
      const response = await fetch(`${POKEMON_API_URL}/${pokemonId}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar Pokémon.');
      }

      const data = await response.json();
      setPokemon(preparePokemonData(data));
    } catch (err) {
      setError(
        'Não foi possível carregar o Pokémon. Verifique sua internet e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!gameFinished) {
      loadRandomPokemon();
    }
  }, [round, gameKey, gameFinished, loadRandomPokemon]);

  const handleSubmitGuess = () => {
    if (!pokemon) return;

    const normalizedGuess = normalizePokemonName(guess);

    if (!normalizedGuess) {
      setFeedback('Digite um nome antes de responder.');
      return;
    }

    const isCorrect = pokemon.acceptedAnswers.includes(normalizedGuess);

    if (isCorrect) {
      setScore((previousScore) => previousScore + 1);
      setModalInfo({
        title: 'Você acertou!',
        message: `Parabéns! O Pokémon era ${pokemon.displayName}. Você ganhou 1 ponto.`,
        correct: true,
      });
      setModalVisible(true);
      return;
    }

    setGuess('');

    if (clueStage < 3) {
      const nextStage = clueStage + 1;
      setClueStage(nextStage);

      if (nextStage === 1) {
        setFeedback('Errou! Nova pista liberada: habilidade.');
      } else if (nextStage === 2) {
        setFeedback('Errou! Nova pista liberada: tamanho.');
      } else {
        setFeedback(
          'Errou! A imagem foi revelada. Agora você pode continuar tentando ou desistir.'
        );
      }

      return;
    }

    setFeedback('Ainda não foi dessa vez. Você pode tentar novamente ou desistir.');
  };

  const handleGiveUp = () => {
    if (!pokemon) return;

    setModalInfo({
      title: 'Você desistiu!',
      message: `O Pokémon era ${pokemon.displayName}. Nenhum ponto foi somado nesta rodada.`,
      correct: false,
    });

    setModalVisible(true);
  };

  const handleNextRound = () => {
    setModalVisible(false);

    if (round >= TOTAL_ROUNDS) {
      setGameFinished(true);
      return;
    }

    setRound((previousRound) => previousRound + 1);
  };

  const handleRestartGame = () => {
    usedPokemonIds.current.clear();
    setRound(1);
    setScore(0);
    setGuess('');
    setFeedback('');
    setClueStage(0);
    setError('');
    setPokemon(null);
    setGameFinished(false);
    setModalVisible(false);
    setGameKey((previousKey) => previousKey + 1);
  };

  const progressPercentage = `${(round / TOTAL_ROUNDS) * 100}%`;

  if (gameFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.logo}>Quem é esse Pokémon?</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Fim de jogo!</Text>
            <Text style={styles.resultScore}>
              Você acertou {score} de {TOTAL_ROUNDS} Pokémon.
            </Text>

            <Text style={styles.resultMessage}>
              {score === TOTAL_ROUNDS
                ? 'Perfeito! Você é praticamente um Mestre Pokémon.'
                : score >= 7
                  ? 'Muito bem! Seu conhecimento Pokémon está forte.'
                  : score >= 4
                    ? 'Bom resultado! Com mais treino você melhora.'
                    : 'Não foi dessa vez, mas a revanche está liberada!'}
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleRestartGame}>
              <Text style={styles.primaryButtonText}>Jogar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>Quem é esse Pokémon?</Text>
            <Text style={styles.subtitle}>
              Descubra o Pokémon
            </Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.statusLabel}>Pontos</Text>
            <Text style={styles.statusValue}>{score}</Text>
          </View>

          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#ffcb05" />
              <Text style={styles.loadingText}>Sorteando Pokémon...</Text>
            </View>
          )}

          {!loading && error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Ops!</Text>
              <Text style={styles.errorText}>{error}</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={loadRandomPokemon}>
                <Text style={styles.primaryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loading && !error && pokemon ? (
            <View style={styles.gameCard}>
              <Text style={styles.questionTitle}>Quem é esse Pokémon?</Text>

              <View style={styles.mysteryBox}>
                {clueStage >= 3 && pokemon.image ? (
                  <Image source={{ uri: pokemon.image }} style={styles.pokemonImage} />
                ) : (
                  <Text style={styles.questionMark}>?</Text>
                )}
              </View>

              //IA: pedi ajuda do chatGPT para inplementar o sistema de dicas
              <View style={styles.cluesContainer}>
                <View style={styles.clueCard}>
                  <Text style={styles.clueLabel}>Vamos começar!! A primeira dica é o tipo!</Text>
                  <View style={styles.typeRow}>
                    {pokemon.types.map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.typeBadge,
                          { backgroundColor: TYPE_COLORS[type] || '#555' },
                        ]}
                      >
                        <Text style={styles.typeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {clueStage >= 1 && (
                  <View style={styles.clueCard}>
                    <Text style={styles.clueLabel}>Não conseguiu só com os tipos? Que tal com a habilidade!</Text>
                    <Text style={styles.clueValue}>{pokemon.ability}</Text>
                  </View>
                )}

                {clueStage >= 2 && (
                  <View style={styles.clueCard}>
                    <Text style={styles.clueLabel}>Vou ser legal! Esse é o tamanho!</Text>
                    <Text style={styles.clueValue}>{pokemon.sizeCategory}</Text>
                  </View>
                )}

                {clueStage >= 3 && (
                  <View style={styles.clueCard}>
                    <Text style={styles.clueLabel}>Sério? Vou deixar de mão beijada. Aqui à imagem.</Text>
                    <Text style={styles.clueValue}>
                      Acerte o pokemon com esta imagem
                    </Text>
                  </View>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Digite o nome do Pokémon"
                placeholderTextColor="#8a8a8a"
                value={guess}
                onChangeText={setGuess}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleSubmitGuess}
              />

              {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitGuess}>
                <Text style={styles.primaryButtonText}>Responder</Text>
              </TouchableOpacity>

              {clueStage >= 3 && (
                <Pressable style={styles.secondaryButton} onPress={handleGiveUp}>
                  <Text style={styles.secondaryButtonText}>Desistiu? Quer a resposta? Clica aqui</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text
              style={[
                styles.modalTitle,
                modalInfo.correct ? styles.modalCorrect : styles.modalWrong,
              ]}
            >
              {modalInfo.title}
            </Text>

            <Text style={styles.modalMessage}>{modalInfo.message}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleNextRound}>
              <Text style={styles.primaryButtonText}>
                {round >= TOTAL_ROUNDS ? 'Ver resultado' : 'Próxima rodada'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

//IA: pedi ajuda ao chatGPT para ajudar na estilização do css
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121826',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    color: '#ffcb05',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#d7def5',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#1f2a44',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f3d5f',
  },
  statusLabel: {
    color: '#aeb8d4',
    fontSize: 13,
    marginBottom: 4,
  },
  statusValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#263149',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffcb05',
    borderRadius: 999,
  },
  loadingCard: {
    backgroundColor: '#1f2a44',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 16,
  },
  errorCard: {
    backgroundColor: '#3a1f2a',
    borderRadius: 24,
    padding: 22,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorTitle: {
    color: '#ff8585',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#ffe1e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  gameCard: {
    backgroundColor: '#1f2a44',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334361',
  },
  scoreCard: {
    backgroundColor: '#1f2a44',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f3d5f',
    marginBottom: 20,
    textAlign: 'center',
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  questionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18,
  },
  mysteryBox: {
    height: 230,
    borderRadius: 22,
    backgroundColor: '#151d2d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334361',
  },
  questionMark: {
    color: '#ffcb05',
    fontSize: 110,
    fontWeight: '900',
  },
  pokemonImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  cluesContainer: {
    gap: 12,
    marginBottom: 18,
  },
  clueCard: {
    backgroundColor: '#263149',
    borderRadius: 18,
    padding: 14,
  },
  clueLabel: {
    color: '#aeb8d4',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '700',
  },
  clueValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  typeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 10,
  },
  feedbackText: {
    color: '#ffdf70',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#ffcb05',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1c2541',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcb05',
  },
  secondaryButtonText: {
    color: '#ffcb05',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalCorrect: {
    color: '#1f8f4d',
  },
  modalWrong: {
    color: '#c2410c',
  },
  modalMessage: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: '#1f2a44',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334361',
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  resultScore: {
    color: '#ffcb05',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  resultMessage: {
    color: '#d7def5',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
});