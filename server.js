const express = require("express");
const { execFile } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/optimize", (req, res) => {
    const { budget, items } = req.body;

    if (
        !Number.isInteger(budget) ||
        budget <= 0 ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            error: "Please provide a valid budget and inventory items."
        });
    }

    // Convert website data into C++ input
    let input = `${budget} ${items.length}\n`;

    for (const item of items) {
        const safeName = String(item.name)
            .trim()
            .replace(/\s+/g, "_");

        input += `${safeName} ${Number(item.cost)} ${Number(item.priority)}\n`;
    }

    const executable = path.join(__dirname, "knapsack.exe");

    const child = execFile(executable, (error, stdout, stderr) => {
        if (error) {
            console.error(stderr || error.message);

            return res.status(500).json({
                error: "Could not run the C++ optimization program."
            });
        }

        try {
            const lines = stdout.trim().split(/\r?\n/);

            const maximumPriority = Number(lines[0]);
            const totalCost = Number(lines[1]);
            const remainingBudget = Number(lines[2]);
            const selectedCount = Number(lines[3]);

            const selectedItems = lines
                .slice(4, 4 + selectedCount)
                .map(line => {
                    const [name, cost, priority] = line.split("|");

                    return {
                        name,
                        cost: Number(cost),
                        priority: Number(priority)
                    };
                });

            res.json({
                maximumPriority,
                totalCost,
                remainingBudget,
                selectedItems
            });
        } catch (parseError) {
            console.error(parseError);

            res.status(500).json({
                error: "Could not read the C++ output."
            });
        }
    });

    child.stdin.write(input);
    child.stdin.end();
});

app.listen(PORT, () => {
    console.log(`MediOpt server running at http://localhost:${PORT}`);
});