const currentMenuPlan = { start_date: "2026-05-18" };
const myInventory = [
    { id: 1, name: "Pollo molido", expiration_date: "2026-05-20" }
];
const selectedIngredients = [1];

const blocked = new Set();
const startDateStr = currentMenuPlan.start_date.split('T')[0];
const selectedItems = myInventory.filter(i => selectedIngredients.includes(i.id) && i.expiration_date);

for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const scheduledDate = new Date(`${startDateStr}T12:00:00`);
    scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
    const scheduledStr = scheduledDate.toISOString().split('T')[0];

    const byName = {};
    for (const item of selectedItems) {
        if (!byName[item.name]) byName[item.name] = [];
        byName[item.name].push(item.expiration_date);
    }

    const hasBlocker = Object.values(byName).some(dates =>
        dates.every(d => {
            const dSplit = d.split('T')[0];
            const isBlocked = dSplit < scheduledStr;
            console.log(`dayIndex=${dayIndex}, scheduledStr=${scheduledStr}, dSplit=${dSplit}, isBlocked=${isBlocked}`);
            return isBlocked;
        })
    );

    if (hasBlocker) blocked.add(dayIndex);
}

console.log("Blocked days:", Array.from(blocked));
