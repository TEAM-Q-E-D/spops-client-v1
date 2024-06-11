import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Flex,
  Image,
  Text,
} from "@chakra-ui/react";
import MarqueeText from "./MarqueeText";
import AdminMode from "./components/AdminMode";
import PlayerList from "./components/PlayerList";
import GameControls from "./components/GameControls";
import GameModal from "./components/GameModal";
import EditPlayerModal from "./components/EditPlayerModal";

const api = process.env.REACT_APP_API_URL;
const place = "중화A"
const streamlit = process.env.REACT_APP_STREAMLIT_URL;
const notice = "";

let image_name = "junghwa.png"


function App() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [matchTime, setMatchTime] = useState(0);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isGameModalOpen, setGameModalOpen] = useState(false);
  const [currentGamePlayers, setCurrentGamePlayers] = useState({ player1: "", player2: "" });
  const [editedPlayerIndex, setEditedPlayerIndex] = useState(null);
  const [editedPlayerName, setEditedPlayerName] = useState("");
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const timerInterval = useRef(null);

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = () => {
    axios.get(`${api}/players`, { params: { place } })
      .then(response => setPlayers(response.data))
      .catch(error => console.error(error));
  };

  const addPlayer = () => {
    if (newPlayer) {
      axios.post(`${api}/players`, { place, name: newPlayer })
        .then(() => {
          fetchPlayers();
          setNewPlayer("");
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            setNewPlayer("");
          }
          console.error(error);
        });
    }
  };

  const addDumy = () => {
    axios.post(`${api}/players`, { place, name: "빈자리" })
      .then(() => fetchPlayers())
      .catch(error => console.error(error));
  };

  const removePlayer = (index) => {
    axios.delete(`${api}/players/${index}`, { params: { place } })
      .then(() => fetchPlayers())
      .catch(error => console.error(error));
  };

  const startCurrentGame = () => {
    setIsStart(true);
    setMatchTime(0);
    const startTime = new Date().getTime();
    timerInterval.current = setInterval(() => {
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      setMatchTime(elapsedSeconds);
    }, 1000);
  };

  const endCurrentGame = () => {
    if (players.length > 1) {
      setGameModalOpen(true);
      setCurrentGamePlayers({ player1: players[0], player2: players[1] });
      clearInterval(timerInterval.current);
    }
  };

  const closeResultModal = () => {
    setGameModalOpen(false);
    setIsStart(false);
    setPlayer1Score(0);
    setPlayer2Score(0);
    removePlayer(0);
    removePlayer(0);
  };

  const submitGameResult = () => {
    if (player1Score === player2Score) {
      window.alert("동점입니다. 점수를 다시 입력해주세요.");
      return;
    }
    const gameResultData = {
      place,
      player1_name: currentGamePlayers.player1,
      player1_score: player1Score,
      player2_name: currentGamePlayers.player2,
      player2_score: player2Score,
      match_time: matchTime,
    };
    console.log("결과 보내는 데이터")
    console.log(gameResultData)

    axios.post(`${api}/result`, gameResultData)
      .then(response => console.log(response))
      .catch(error => console.error(error));
    closeResultModal();
  };

  const openEditModal = (index, playerName) => {
    setEditedPlayerIndex(index);
    setEditedPlayerName(playerName);
    setEditModalOpen(true);
  };

  const saveEditedPlayerName = () => {
    if (editedPlayerIndex !== null && editedPlayerName.trim() !== "") {
      const updatedPlayers = [...players];
      updatedPlayers[editedPlayerIndex] = editedPlayerName.trim();
      setPlayers(updatedPlayers);
      setEditedPlayerIndex(null);
      setEditedPlayerName("");

      axios.put(`${api}/players/${editedPlayerIndex}`, { place, newName: editedPlayerName.trim() })
        .then(response => console.log(response))
        .catch(error => console.error(error));
      setEditModalOpen(false);
    }
  };

  const openStreamlit = () => {
    window.open(streamlit, "_blank");
  };

  return (
    <Container centerContent>
      <Box mt={6} mb={4} p={2} w="100%" maxW="500px" borderRadius="lg" borderWidth="2px" borderColor="gray.300">
        <MarqueeText text={notice} />
      </Box>

      <Box p={5} w="100%" maxW="500px" borderRadius="lg" bg="gray.100" borderWidth="2px" borderColor="gray.300">

        <AdminMode
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          newPlayer={newPlayer}
          setNewPlayer={setNewPlayer}
          addPlayer={addPlayer}
          addDumy={addDumy}
        />

        <Flex justifyContent="center" alignItems="center" mt={5}>
          <Image src={image_name} boxSize="100px" mr={10} />
          <Text fontSize="3xl" fontWeight="bold" mt={2} color="black">
            {players.length} 명
          </Text>
        </Flex>

        <GameControls
          isAdmin={isAdmin}
          isStart={isStart}
          players={players}
          startCurrentGame={startCurrentGame}
          endCurrentGame={endCurrentGame}
          removePlayer={removePlayer}
          openEditModal={openEditModal}
        />

        <PlayerList
          players={players}
          isAdmin={isAdmin}
          removePlayer={removePlayer}
          openEditModal={openEditModal}
        />

        <GameModal
          isOpen={isGameModalOpen}
          onClose={closeResultModal}
          currentGamePlayers={currentGamePlayers}
          player1Score={player1Score}
          setPlayer1Score={setPlayer1Score}
          player2Score={player2Score}
          setPlayer2Score={setPlayer2Score}
          submitGameResult={submitGameResult}
        />

        <EditPlayerModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          editedPlayerName={editedPlayerName}
          setEditedPlayerName={setEditedPlayerName}
          saveEditedPlayerName={saveEditedPlayerName}
        />

        <Box mt={2} p={2} w="100%" maxW="500px" borderRadius="lg" bg="gray.100" borderWidth="2px" borderColor="gray.300">
          <Button fontWeight="bold" textColor="white" bg="blue.400" onClick={openStreamlit} width="100%" isDisabled={true}>
            Button
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
