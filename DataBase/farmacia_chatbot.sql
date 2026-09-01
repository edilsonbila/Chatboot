-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 12-Ago-2024 às 16:04
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `farmacia_chatbot`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `medicamentos`
--

CREATE TABLE `medicamentos` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `medicamentos`
--

INSERT INTO `medicamentos` (`id`, `nome`, `descricao`, `preco`) VALUES
(1, 'Paracetamol', 'Medicamento para alívio de dores e febres.', 3.50),
(2, 'Ibuprofeno', 'Anti-inflamatório não esteroide para dores e inflamações.', 5.75),
(3, 'Paracetamol', 'Medicamento para alívio de dores e febres.', 3.50),
(4, 'Ibuprofeno', 'Anti-inflamatório não esteroide para dores e inflamações.', 5.75);

-- --------------------------------------------------------

--
-- Estrutura da tabela `perguntas`
--

CREATE TABLE `perguntas` (
  `id` int(11) NOT NULL,
  `pergunta` text NOT NULL,
  `resposta` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `perguntas`
--

INSERT INTO `perguntas` (`id`, `pergunta`, `resposta`) VALUES
(1, 'Quais são os horários de funcionamento?', 'Estamos abertos de segunda a sexta das 8h às 18h.'),
(2, 'Vocês fazem entrega?', 'Sim, entregamos na região próxima à farmácia.'),
(3, 'Quais são os horários de funcionamento?', 'Estamos abertos de segunda a sexta das 8h às 18h.'),
(4, 'Vocês fazem entrega?', 'Sim, entregamos na região próxima à farmácia.');

-- --------------------------------------------------------

--
-- Estrutura da tabela `saudacoes`
--

CREATE TABLE `saudacoes` (
  `id` int(11) NOT NULL,
  `saudacao` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `saudacoes`
--

INSERT INTO `saudacoes` (`id`, `saudacao`) VALUES
(1, 'Olá! Como posso ajudar?'),
(2, 'Bom dia! O que você precisa saber?'),
(3, 'Olá! Como posso ajudar?'),
(4, 'Bom dia! O que você precisa saber?'),
(5, 'Bom dia! Como posso ajudar você hoje?'),
(6, 'Boa tarde! O que posso fazer por você?'),
(7, 'Boa noite! Em que posso ajudar?');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `medicamentos`
--
ALTER TABLE `medicamentos`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `perguntas`
--
ALTER TABLE `perguntas`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `saudacoes`
--
ALTER TABLE `saudacoes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `medicamentos`
--
ALTER TABLE `medicamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `perguntas`
--
ALTER TABLE `perguntas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `saudacoes`
--
ALTER TABLE `saudacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- --------------------------------------------------------
-- Farmácias por todo Moçambique e respectivo stock/preços (MZN)
-- (mesmos dados que data/farmacias.json)
-- --------------------------------------------------------

CREATE TABLE `farmacias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `provincia` varchar(100) NOT NULL,
  `endereco` varchar(255) NOT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `horario` varchar(50) DEFAULT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `longitude` decimal(9,6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `estoque` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `farmacia_id` int(11) NOT NULL,
  `medicamento_id` int(11) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `farmacia_id` (`farmacia_id`),
  KEY `medicamento_id` (`medicamento_id`),
  CONSTRAINT `estoque_farmacia_fk` FOREIGN KEY (`farmacia_id`) REFERENCES `farmacias` (`id`),
  CONSTRAINT `estoque_medicamento_fk` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamentos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `farmacias` (`id`,`nome`,`cidade`,`provincia`,`endereco`,`telefone`,`horario`,`latitude`,`longitude`) VALUES
(1, 'Farmácia Calendula', 'Maputo', 'Maputo Cidade', 'Av. 24 de Julho, nº 1345', '+258 21 400 111', '07:30-21:00', -25.9692, 32.5732),
(2, 'Farmácia Moderna', 'Maputo', 'Maputo Cidade', 'Av. Eduardo Mondlane, nº 2210', '+258 21 300 222', '24 horas', -25.9655, 32.5832),
(3, 'Farmácia Sol', 'Maputo', 'Maputo Cidade', 'Av. Julius Nyerere, nº 780, Polana', '+258 21 490 333', '08:00-20:00', -25.956, 32.596),
(4, 'Farmácia Matola Rio', 'Matola', 'Maputo Província', 'Av. da Namaacha, Matola-Rio', '+258 21 720 444', '08:00-19:00', -25.9622, 32.4589),
(5, 'Farmácia Machava', 'Matola', 'Maputo Província', 'EN4, Machava-Sede', '+258 21 750 555', '07:00-20:00', -25.915, 32.5),
(6, 'Farmácia Xai-Xai Central', 'Xai-Xai', 'Gaza', 'Av. Samora Machel, Xai-Xai', '+258 28 220 666', '08:00-19:00', -25.0519, 33.6442),
(7, 'Farmácia Inhambane', 'Inhambane', 'Inhambane', 'Av. da Independência, Inhambane', '+258 29 320 777', '08:00-18:00', -23.865, 35.3833),
(8, 'Farmácia Beira Mar', 'Beira', 'Sofala', 'Rua Major Serpa Pinto, Baixa da Beira', '+258 23 320 888', '07:30-21:00', -19.8436, 34.8389),
(9, 'Farmácia Macúti', 'Beira', 'Sofala', 'Av. das FPLM, Macúti', '+258 23 310 999', '08:00-20:00', -19.81, 34.88),
(10, 'Farmácia Chimoio', 'Chimoio', 'Manica', 'Rua do Bárue, Chimoio', '+258 25 123 000', '08:00-19:00', -19.1164, 33.4833),
(11, 'Farmácia Tete', 'Tete', 'Tete', 'Av. Eduardo Mondlane, Tete', '+258 25 222 111', '07:30-19:30', -16.1564, 33.5867),
(12, 'Farmácia Quelimane', 'Quelimane', 'Zambézia', 'Av. Josina Machel, Quelimane', '+258 24 213 222', '08:00-19:00', -17.8786, 36.8883),
(13, 'Farmácia Nampula Central', 'Nampula', 'Nampula', 'Av. Eduardo Mondlane, Nampula', '+258 26 212 333', '07:30-20:00', -15.1165, 39.2666),
(14, 'Farmácia Muhala', 'Nampula', 'Nampula', 'Bairro de Muhala Expansão, Nampula', '+258 26 215 444', '08:00-19:00', -15.135, 39.29),
(15, 'Farmácia Nacala', 'Nacala', 'Nampula', 'Av. Principal, Nacala-Porto', '+258 26 526 555', '08:00-18:30', -14.5428, 40.6728),
(16, 'Farmácia Pemba', 'Pemba', 'Cabo Delgado', 'Av. 25 de Setembro, Pemba', '+258 27 220 666', '08:00-19:00', -12.974, 40.5178),
(17, 'Farmácia Lichinga', 'Lichinga', 'Niassa', 'Rua Filipe Samuel Magaia, Lichinga', '+258 27 120 777', '08:00-18:00', -13.3128, 35.2406);

INSERT INTO `estoque` (`farmacia_id`,`medicamento_id`,`preco`,`quantidade`) VALUES
(1, 1, 45.00, 120),
(1, 2, 85.00, 60),
(1, 4, 350.00, 25),
(1, 6, 190.00, 40),
(1, 8, 60.00, 80),
(2, 1, 40.00, 200),
(2, 3, 320.00, 30),
(2, 5, 210.00, 50),
(2, 7, 150.00, 35),
(2, 10, 25.00, 300),
(3, 1, 50.00, 90),
(3, 2, 90.00, 40),
(3, 4, 330.00, 15),
(3, 11, 120.00, 45),
(3, 12, 95.00, 60),
(4, 1, 38.00, 150),
(4, 4, 300.00, 40),
(4, 9, 110.00, 55),
(4, 10, 20.00, 250),
(5, 2, 80.00, 70),
(5, 3, 290.00, 20),
(5, 6, 180.00, 30),
(5, 8, 55.00, 100),
(6, 1, 42.00, 80),
(6, 4, 340.00, 30),
(6, 10, 22.00, 200),
(6, 12, 90.00, 40),
(7, 1, 48.00, 60),
(7, 2, 95.00, 30),
(7, 4, 360.00, 20),
(7, 7, 160.00, 25),
(8, 1, 44.00, 110),
(8, 2, 88.00, 50),
(8, 4, 320.00, 60),
(8, 5, 220.00, 40),
(8, 10, 24.00, 180),
(9, 1, 46.00, 70),
(9, 3, 310.00, 25),
(9, 6, 195.00, 35),
(9, 9, 105.00, 45),
(9, 11, 125.00, 30),
(10, 1, 43.00, 90),
(10, 4, 315.00, 50),
(10, 8, 58.00, 60),
(10, 12, 92.00, 40),
(11, 1, 47.00, 100),
(11, 2, 92.00, 40),
(11, 4, 330.00, 45),
(11, 10, 26.00, 150),
(12, 1, 45.00, 85),
(12, 3, 300.00, 20),
(12, 4, 325.00, 55),
(12, 9, 100.00, 50),
(13, 1, 46.00, 130),
(13, 2, 89.00, 55),
(13, 4, 310.00, 70),
(13, 6, 185.00, 30),
(13, 10, 23.00, 220),
(14, 1, 41.00, 75),
(14, 5, 215.00, 25),
(14, 7, 155.00, 20),
(14, 11, 118.00, 35),
(15, 1, 49.00, 50),
(15, 4, 345.00, 30),
(15, 10, 27.00, 120),
(16, 1, 50.00, 65),
(16, 2, 96.00, 30),
(16, 4, 340.00, 40),
(16, 9, 112.00, 40),
(17, 1, 52.00, 45),
(17, 4, 355.00, 25),
(17, 8, 62.00, 40),
(17, 10, 28.00, 100);

-- Consulta: farmácias mais próximas com um medicamento (substituir :lat, :lng, :medicamento)
-- SELECT f.nome, f.cidade, e.preco,
--   6371*2*ASIN(SQRT(POW(SIN(RADIANS(f.latitude-:lat)/2),2)+COS(RADIANS(:lat))*COS(RADIANS(f.latitude))*POW(SIN(RADIANS(f.longitude-:lng)/2),2))) AS distancia_km
-- FROM estoque e JOIN farmacias f ON f.id=e.farmacia_id JOIN medicamentos m ON m.id=e.medicamento_id
-- WHERE m.nome LIKE :medicamento AND e.quantidade>0 ORDER BY distancia_km LIMIT 3;
