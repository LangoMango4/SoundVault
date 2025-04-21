import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Card symbols for the memory game
const CARD_SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐮'];

interface MemoryCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

export function MemoryMatch() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Initialize the game
  const initializeGame = () => {
    let pairsCount = 8; // Default medium difficulty
    if (difficulty === 'easy') pairsCount = 6;
    if (difficulty === 'hard') pairsCount = 12;

    // Create card pairs
    const symbols = CARD_SYMBOLS.slice(0, pairsCount);
    const cardPairs = [...symbols, ...symbols];
    
    // Shuffle the cards
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        flipped: false,
        matched: false,
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameStarted(true);
    setGameOver(false);
  };

  // Handle card click
  const handleCardClick = (id: number) => {
    // Ignore clicks if game over or more than 2 cards are flipped
    if (gameOver || flippedCards.length >= 2) return;
    
    // Ignore clicking on already flipped or matched cards
    const clickedCard = cards.find(card => card.id === id);
    if (!clickedCard || clickedCard.flipped || clickedCard.matched) return;
    
    // Flip the card
    const updatedCards = cards.map(card => 
      card.id === id ? { ...card, flipped: true } : card
    );
    
    const updatedFlippedCards = [...flippedCards, id];
    
    setCards(updatedCards);
    setFlippedCards(updatedFlippedCards);
    
    // Check for matches if two cards are flipped
    if (updatedFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstId, secondId] = updatedFlippedCards;
      const firstCard = updatedCards.find(card => card.id === firstId);
      const secondCard = updatedCards.find(card => card.id === secondId);
      
      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        // Match found
        setTimeout(() => {
          const matchedCards = updatedCards.map(card => 
            (card.id === firstId || card.id === secondId) 
              ? { ...card, matched: true } 
              : card
          );
          
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Check if all pairs are matched
          if (matchedPairs + 1 === updatedCards.length / 2) {
            setGameOver(true);
          }
        }, 500);
      } else {
        // No match, flip cards back after delay
        setTimeout(() => {
          const resetFlippedCards = updatedCards.map(card => 
            (card.id === firstId || card.id === secondId) 
              ? { ...card, flipped: false } 
              : card
          );
          
          setCards(resetFlippedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Determine the grid layout based on difficulty
  const getGridLayout = () => {
    switch (difficulty) {
      case 'easy': return 'grid-cols-3 grid-rows-4';
      case 'hard': return 'grid-cols-6 grid-rows-4';
      default: return 'grid-cols-4 grid-rows-4'; // medium
    }
  };

  // Start a new game with the selected difficulty
  const startGame = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
    
    // Initialize after state update
    setTimeout(() => {
      initializeGame();
    }, 0);
  };

  // Card component
  const MemoryCard = ({ card }: { card: MemoryCard }) => (
    <div
      className={`aspect-square flex items-center justify-center cursor-pointer transform transition-all duration-300 ${
        card.flipped || card.matched 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-card hover:bg-primary/10'
      } ${card.matched ? 'bg-green-500 text-white' : ''} rounded-md shadow-md`}
      onClick={() => handleCardClick(card.id)}
    >
      {(card.flipped || card.matched) ? (
        <span className="text-3xl">{card.symbol}</span>
      ) : (
        <span className="text-3xl">?</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Memory Match</h1>
      
      {!gameStarted ? (
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl mb-4 text-center">Select Difficulty</h2>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => startGame('easy')} variant="outline">
              Easy (6 pairs)
            </Button>
            <Button onClick={() => startGame('medium')} variant="default">
              Medium (8 pairs)
            </Button>
            <Button onClick={() => startGame('hard')} variant="destructive">
              Hard (12 pairs)
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <div className="text-lg">
              <span className="font-medium">Moves:</span> {moves}
            </div>
            <div className="text-lg">
              <span className="font-medium">Matched:</span> {matchedPairs} / {cards.length / 2}
            </div>
            <Button variant="outline" onClick={() => setGameStarted(false)}>
              New Game
            </Button>
          </div>
          
          <div className={`grid ${getGridLayout()} gap-2 w-full`}>
            {cards.map(card => (
              <MemoryCard key={card.id} card={card} />
            ))}
          </div>
          
          {gameOver && (
            <div className="mt-6 bg-green-50 p-4 rounded-md border border-green-200">
              <h2 className="text-xl text-green-800 font-bold mb-2">Congratulations!</h2>
              <p className="mb-4">You completed the game in {moves} moves.</p>
              <Button onClick={initializeGame}>Play Again</Button>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          Flip the cards and find matching pairs. Try to complete the game in as few moves as possible.
        </p>
      </div>
    </div>
  );
}