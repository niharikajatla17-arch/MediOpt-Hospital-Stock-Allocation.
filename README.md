# MediOpt – Hospital Stock Allocation Under a Budget

## Project Overview
MediOpt is a hospital resource allocation system that helps hospitals select essential medicines and medical equipment while staying within a limited purchasing budget.

The project compares two algorithmic approaches to maximize the total clinical priority of selected inventory items.

## Problem Statement
Given a limited hospital purchasing budget, select medical inventory lots to maximize the total clinical priority value without exceeding the available budget.

## Algorithms Implemented

### 1. 0/1 Knapsack – Dynamic Programming
- Each inventory lot is either selected completely or not selected.
- Uses Dynamic Programming to maximize clinical priority within the budget.
- Suitable for real-world medical items that cannot be divided.

### 2. Fractional Knapsack – Greedy Algorithm
- Selects inventory based on the priority-to-cost ratio.
- Allows partial allocation of lots.
- Demonstrates how a greedy strategy performs compared with 0/1 Knapsack.

## Technologies Used
- HTML
- CSS
- JavaScript
- Node.js and Express
- C++

## Features
- Add and manage hospital inventory.
- Enter item cost, priority and quantity.
- Set a hospital purchasing budget.
- Optimize inventory using both algorithms.
- Compare selected and unselected lots.
- View allocation results and budget utilization.

## How to Run the Project

1. Install Node.js and a C++ compiler (such as GCC).
2. Clone or download this repository.
3. Open the project folder in VS Code.
4. Install dependencies:

   `npm install`

5. Compile the C++ program:

   `g++ knapsack.cpp -o knapsack.exe`

6. Start the server:

   `node server.js`

7. Open `http://localhost:3000` in your browser.

## Project Objective
To demonstrate the application of Dynamic Programming and Greedy algorithms to a practical hospital resource allocation problem.

**Project:** MediOpt  
**Domain:** Design and Analysis of Algorithms (DAA)
