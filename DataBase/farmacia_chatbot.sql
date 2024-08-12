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
