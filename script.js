// ========================================
// MEDIOPT
// Hospital Stock Allocation Under a Budget
// Algorithm 1: 0/1 Knapsack - Dynamic Programming
// Algorithm 2: Fractional Knapsack - Greedy
// ========================================


// ========================================
// LOAD AND VALIDATE SAVED DATA
// ========================================

function loadInventory() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("medioptInventory") || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved
            .map(item => ({
                id: item.id || Date.now() + Math.random(),
                name: String(item.name || "").trim(),
                category: String(item.category || "Other"),
                cost: Number(item.cost),
                priority: Number(item.priority),
                quantity: Number(item.quantity)
            }))
            .filter(item =>
                item.name &&
                Number.isFinite(item.cost) &&
                Number.isFinite(item.priority) &&
                Number.isFinite(item.quantity) &&
                item.cost > 0 &&
                item.priority > 0 &&
                item.quantity > 0
            );
    } catch (error) {
        console.error("Could not load inventory:", error);
        return [];
    }
}

let inventory = loadInventory();

let budget = Number(
    localStorage.getItem("medioptBudget") || 0
);

if (!Number.isFinite(budget) || budget < 0) {
    budget = 0;
}


// ========================================
// FORMAT VALUES
// ========================================

function currency(amount) {
    const value = Number(amount);

    return "₹" + (
        Number.isFinite(value) ? value : 0
    ).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function formatNumber(number) {
    const value = Number(number);

    return (
        Number.isFinite(value) ? value : 0
    ).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}


// ========================================
// SAVE INVENTORY
// ========================================

function saveInventory() {
    localStorage.setItem(
        "medioptInventory",
        JSON.stringify(inventory)
    );
}


// ========================================
// DISPLAY INVENTORY
// ========================================

function renderInventory() {
    const body = document.getElementById("inventoryBody");
    const emptyState = document.getElementById("emptyState");

    body.innerHTML = "";

    emptyState.style.display =
        inventory.length > 0 ? "none" : "block";

    inventory.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHTML(item.name)}
                <br>
                Qty: ${formatNumber(item.quantity)}
            </td>

            <td>${escapeHTML(item.category)}</td>

            <td>${currency(item.cost)}</td>

            <td>${formatNumber(item.priority)}</td>

            <td>
                <button
                    type="button"
                    onclick="deleteItem(${Number(item.id)})"
                >
                    Delete
                </button>
            </td>
        `;

        body.appendChild(row);
    });

    document.getElementById("itemCount").textContent =
        inventory.length;

    document.getElementById("inventoryPill").textContent =
        inventory.length + " items";
}


// ========================================
// DELETE INVENTORY ITEM
// ========================================

function deleteItem(id) {
    inventory = inventory.filter(item => item.id !== id);

    saveInventory();
    renderInventory();

    clearOptimization(
        "Inventory updated. Optimize again to see the new allocation."
    );
}


// ========================================
// CLEAR OLD RESULTS
// ========================================

function clearOptimization(message) {
    const results = document.getElementById("optimizationResults");

    if (results) {
        results.style.display = "none";
    }

    document.getElementById("optimizationMessage").textContent =
        message;

    document.getElementById("priorityDisplay").textContent = "—";
}


// ========================================
// ADD INVENTORY ITEM
// ========================================

document.getElementById("itemForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const item = {
            id: Date.now(),

            name: document
                .getElementById("itemName")
                .value.trim(),

            category: document
                .getElementById("itemCategory")
                .value,

            cost: Number(
                document.getElementById("itemCost").value
            ),

            priority: Number(
                document.getElementById("itemPriority").value
            ),

            quantity: Number(
                document.getElementById("itemQuantity").value
            )
        };

        if (
            !item.name ||
            !item.category ||
            !Number.isFinite(item.cost) ||
            !Number.isFinite(item.priority) ||
            !Number.isFinite(item.quantity) ||
            item.cost <= 0 ||
            item.priority <= 0 ||
            item.quantity <= 0
        ) {
            document.getElementById("formMessage").textContent =
                "Please enter valid item details.";

            return;
        }

        inventory.push(item);

        saveInventory();
        renderInventory();

        this.reset();

        document.getElementById("formMessage").textContent =
            "Item added successfully!";

        clearOptimization(
            "Inventory updated. Optimize again to see the new allocation."
        );
    });


// ========================================
// SAVE HOSPITAL BUDGET
// ========================================

document.getElementById("budgetForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const newBudget = Number(
            document.getElementById("budgetInput").value
        );

        if (
            !Number.isFinite(newBudget) ||
            newBudget <= 0
        ) {
            document.getElementById("budgetMessage").textContent =
                "Enter a valid budget.";

            return;
        }

        budget = newBudget;

        localStorage.setItem("medioptBudget", budget);

        renderBudget();

        document.getElementById("budgetMessage").textContent =
            "Budget saved successfully!";

        clearOptimization(
            "Budget updated. Optimize again to see the new allocation."
        );
    });


// ========================================
// DISPLAY BUDGET
// ========================================

function renderBudget() {
    document.getElementById("budgetDisplay").textContent =
        currency(budget);

    document.getElementById("budgetInput").value =
        budget || "";
}


// ========================================
// PREPARE INVENTORY LOTS
// Each inventory entry is one lot.
// ========================================

function prepareLots() {
    return inventory.map(item => {
        const unitCost = Number(item.cost);
        const unitPriority = Number(item.priority);
        const quantity = Number(item.quantity);

        return {
            id: item.id,
            name: item.name,
            category: item.category,

            unitCost,
            unitPriority,
            quantity,

            totalCost: unitCost * quantity,
            totalPriority: unitPriority * quantity
        };
    });
}


// ========================================
// ALGORITHM 1
// 0/1 KNAPSACK - DYNAMIC PROGRAMMING
// Each lot is selected completely or skipped.
// ========================================

function zeroOneKnapsack(lots, budget) {
    const capacity = Math.floor(budget);
    const n = lots.length;

    const dp = Array.from(
        { length: n + 1 },
        () => Array(capacity + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {
        const lot = lots[i - 1];

        const lotCost = Math.ceil(lot.totalCost);
        const lotPriority = lot.totalPriority;

        for (let w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];

            if (lotCost <= w) {
                const selectedPriority =
                    dp[i - 1][w - lotCost] + lotPriority;

                if (selectedPriority > dp[i][w]) {
                    dp[i][w] = selectedPriority;
                }
            }
        }
    }

    const selected = [];
    const skipped = [];

    let w = capacity;

    for (let i = n; i > 0; i--) {
        const lot = lots[i - 1];

        if (dp[i][w] !== dp[i - 1][w]) {
            selected.push({
                ...lot,
                allocatedQuantity: lot.quantity,
                allocatedCost: lot.totalCost,
                allocatedPriority: lot.totalPriority
            });

            w -= Math.ceil(lot.totalCost);
        } else {
            skipped.push({
                ...lot,
                unallocatedQuantity: lot.quantity,
                unallocatedCost: lot.totalCost,
                unallocatedPriority: lot.totalPriority
            });
        }
    }

    selected.reverse();
    skipped.reverse();

    const totalCost = selected.reduce(
        (sum, lot) => sum + lot.allocatedCost,
        0
    );

    const totalPriority = selected.reduce(
        (sum, lot) => sum + lot.allocatedPriority,
        0
    );

    return {
        selected,
        skipped,
        totalCost,
        totalPriority,
        remainingBudget: Math.max(0, budget - totalCost)
    };
}


// ========================================
// ALGORITHM 2
// FRACTIONAL KNAPSACK - GREEDY
// Partial lot allocation is allowed.
// ========================================

function fractionalKnapsack(lots, budget) {
    let remainingBudget = budget;

    const sortedLots = [...lots].sort((a, b) => {
        const ratioA = a.totalCost > 0
            ? a.totalPriority / a.totalCost
            : 0;

        const ratioB = b.totalCost > 0
            ? b.totalPriority / b.totalCost
            : 0;

        return ratioB - ratioA;
    });

    const selected = [];
    const skipped = [];

    for (const lot of sortedLots) {
        if (remainingBudget <= 0) {
            skipped.push({
                ...lot,
                unallocatedQuantity: lot.quantity,
                unallocatedCost: lot.totalCost,
                unallocatedPriority: lot.totalPriority
            });

            continue;
        }

        if (lot.totalCost <= remainingBudget) {
            selected.push({
                ...lot,
                allocatedQuantity: lot.quantity,
                allocatedCost: lot.totalCost,
                allocatedPriority: lot.totalPriority
            });

            remainingBudget -= lot.totalCost;
        } else {
            const fraction = remainingBudget / lot.totalCost;

            const allocatedQuantity =
                lot.quantity * fraction;

            const allocatedCost =
                remainingBudget;

            const allocatedPriority =
                lot.totalPriority * fraction;

            if (fraction > 0) {
                selected.push({
                    ...lot,
                    allocatedQuantity,
                    allocatedCost,
                    allocatedPriority
                });
            }

            const unallocatedQuantity =
                lot.quantity - allocatedQuantity;

            const unallocatedCost =
                lot.totalCost - allocatedCost;

            const unallocatedPriority =
                lot.totalPriority - allocatedPriority;

            if (unallocatedQuantity > 0) {
                skipped.push({
                    ...lot,
                    unallocatedQuantity,
                    unallocatedCost,
                    unallocatedPriority
                });
            }

            remainingBudget = 0;
        }
    }

    const totalCost = selected.reduce(
        (sum, lot) => sum + lot.allocatedCost,
        0
    );

    const totalPriority = selected.reduce(
        (sum, lot) => sum + lot.allocatedPriority,
        0
    );

    return {
        selected,
        skipped,
        totalCost,
        totalPriority,
        remainingBudget: Math.max(0, budget - totalCost)
    };
}


// ========================================
// CREATE ALLOCATION CARD
// ========================================

function createAllocationCard(lot, type) {
    const card = document.createElement("li");

    card.className =
        type === "skipped"
            ? "allocation-card skipped"
            : "allocation-card";

    const isSelected = type === "selected";

    const quantityValue = isSelected
        ? lot.allocatedQuantity
        : lot.unallocatedQuantity;

    const costValue = isSelected
        ? lot.allocatedCost
        : lot.unallocatedCost;

    const priorityValue = isSelected
        ? lot.allocatedPriority
        : lot.unallocatedPriority;

    const heading = document.createElement("h5");
    heading.textContent = lot.name;

    const category = document.createElement("p");
    category.textContent = lot.category;

    const quantity = document.createElement("p");
    quantity.textContent =
        `${isSelected ? "Allocated" : "Unallocated"} Quantity: ` +
        formatNumber(quantityValue);

    const cost = document.createElement("p");
    cost.textContent =
        `${isSelected ? "Allocated" : "Unallocated"} Cost: ` +
        currency(costValue);

    const priority = document.createElement("p");
    priority.textContent =
        `${isSelected ? "Priority Contribution" : "Unallocated Priority"}: ` +
        formatNumber(priorityValue);

    const ratio = document.createElement("p");

    const priorityCostRatio = lot.totalCost > 0
        ? lot.totalPriority / lot.totalCost
        : 0;

    ratio.textContent =
        "Priority / Cost: " + formatNumber(priorityCostRatio);

    card.append(
        heading,
        category,
        quantity,
        cost,
        priority,
        ratio
    );

    return card;
}


// ========================================
// DISPLAY SELECTED / SKIPPED LOTS
// ========================================

function renderAllocationList(elementId, lots, type) {
    const list = document.getElementById(elementId);

    list.innerHTML = "";

    if (lots.length === 0) {
        const empty = document.createElement("li");

        empty.className = "allocation-card";
        empty.textContent = type === "selected"
            ? "No lots selected."
            : "No lots skipped.";

        list.appendChild(empty);
        return;
    }

    lots.forEach(lot => {
        list.appendChild(
            createAllocationCard(lot, type)
        );
    });
}


// ========================================
// DISPLAY ALGORITHM SUMMARY
// ========================================

function displayAlgorithmResult(
    result,
    prefix,
    selectedId,
    skippedId
) {
    const utilization = budget > 0
        ? (result.totalCost / budget) * 100
        : 0;

    document.getElementById(prefix + "Priority").textContent =
        formatNumber(result.totalPriority);

    document.getElementById(prefix + "Cost").textContent =
        currency(result.totalCost);

    document.getElementById(prefix + "Remaining").textContent =
        currency(result.remainingBudget);

    document.getElementById(prefix + "Utilization").textContent =
        utilization.toFixed(1) + "%";

    document.getElementById(prefix + "Progress").style.width =
        Math.min(100, utilization) + "%";

    renderAllocationList(
        selectedId,
        result.selected,
        "selected"
    );

    renderAllocationList(
        skippedId,
        result.skipped,
        "skipped"
    );
}


// ========================================
// OPTIMIZE INVENTORY
// ========================================

document.getElementById("optimizeButton")
    .addEventListener("click", function() {

        const message =
            document.getElementById("optimizationMessage");

        const results =
            document.getElementById("optimizationResults");

        if (!Number.isFinite(budget) || budget <= 0) {
            message.textContent =
                "Please save a valid budget first.";
            return;
        }

        if (inventory.length === 0) {
            message.textContent =
                "Please add medical items first.";
            return;
        }

        // Validate data before calculation
        const validInventory = inventory.every(item =>
            Number.isFinite(Number(item.cost)) &&
            Number.isFinite(Number(item.priority)) &&
            Number.isFinite(Number(item.quantity)) &&
            Number(item.cost) > 0 &&
            Number(item.priority) > 0 &&
            Number(item.quantity) > 0
        );

        if (!validInventory) {
            message.textContent =
                "Some inventory values are invalid. Please check the item details.";
            return;
        }

        message.textContent =
            "Calculating both algorithms...";

        results.style.display = "none";

        const lots = prepareLots();

        const zeroOneResult =
            zeroOneKnapsack(lots, budget);

        const fractionalResult =
            fractionalKnapsack(lots, budget);

        displayAlgorithmResult(
            zeroOneResult,
            "zeroOne",
            "zeroOneSelected",
            "zeroOneSkipped"
        );

        displayAlgorithmResult(
            fractionalResult,
            "fractional",
            "fractionalSelected",
            "fractionalSkipped"
        );

        document.getElementById("priorityDisplay").textContent =
            formatNumber(zeroOneResult.totalPriority);

        const comparisonMessage =
            document.getElementById("comparisonMessage");

        if (
            fractionalResult.totalPriority >
            zeroOneResult.totalPriority
        ) {
            comparisonMessage.textContent =
                "Fractional Knapsack achieved a higher priority because it allows partial lot allocation.";
        } else if (
            fractionalResult.totalPriority ===
            zeroOneResult.totalPriority
        ) {
            comparisonMessage.textContent =
                "Both algorithms achieved the same clinical priority for the available budget.";
        } else {
            comparisonMessage.textContent =
                "0/1 Knapsack achieved a higher priority for this input. Fractional Knapsack is a greedy method and is not guaranteed to produce the optimal result.";
        }

        results.style.display = "block";

        message.textContent =
            "Both algorithms completed successfully!";
    });


// ========================================
// INITIAL PAGE LOAD
// ========================================

saveInventory();
renderInventory();
renderBudget();