#include <iostream>
#include <vector>
#include <string>
using namespace std;

struct Item {
    string name;
    int cost;
    int priority;
};

struct Node {
    int itemIndex;
    int previousNode;
};

int main() {
    int budget, n;

    // Input format: budget, number of items
    cin >> budget >> n;

    vector<Item> items(n);

    // Read item details
    for (int i = 0; i < n; i++) {
        cin >> items[i].name
            >> items[i].cost
            >> items[i].priority;
    }

    // Dynamic programming array
    vector<int> dp(budget + 1, 0);

    // Backtracking history
    vector<Node> history;
    vector<int> lastNode(budget + 1, -1);

    // 0/1 Knapsack optimization
    for (int i = 0; i < n; i++) {
        for (int w = budget; w >= items[i].cost; w--) {

            int newPriority =
                dp[w - items[i].cost] + items[i].priority;

            if (newPriority > dp[w]) {
                dp[w] = newPriority;

                history.push_back({
                    i,
                    lastNode[w - items[i].cost]
                });

                lastNode[w] = history.size() - 1;
            }
        }
    }

    // Find selected items
    vector<int> selectedItems;
    int node = lastNode[budget];

    while (node != -1) {
        selectedItems.push_back(history[node].itemIndex);
        node = history[node].previousNode;
    }

    // Calculate total cost
    int totalCost = 0;

    for (int index : selectedItems) {
        totalCost += items[index].cost;
    }

    // Output in a format the Node.js server can read
    cout << dp[budget] << endl;
    cout << totalCost << endl;
    cout << budget - totalCost << endl;
    cout << selectedItems.size() << endl;

    for (int index : selectedItems) {
        cout << items[index].name << "|"
             << items[index].cost << "|"
             << items[index].priority << endl;
    }

    return 0;
}