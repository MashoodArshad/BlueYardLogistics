-- ==========================================================
-- Verification Queries
-- ==========================================================

USE BlueYardDB;
GO

-- 1. Check Vessel & its Manifested Containers
SELECT 
    v.VesselID, 
    v.Name AS VesselName, 
    c.ContainerID, 
    c.CargoType, 
    c.WeightKg, 
    c.PriorityLevel, 
    c.Destination, 
    c.Status
FROM Vessels v
INNER JOIN Containers c ON v.VesselID = c.VesselID;

-- 2. Check Yard Grid Availability per Terminal
SELECT 
    t.TerminalID, 
    t.Name AS TerminalName, 
    t.Type,
    COUNT(y.SlotID) AS TotalSlots,
    SUM(CASE WHEN y.IsOccupied = 0 THEN 1 ELSE 0 END) AS AvailableSlots
FROM Terminals t
LEFT JOIN YardSlots y ON t.TerminalID = y.TerminalID
GROUP BY t.TerminalID, t.Name, t.Type;

-- 3. Check Initial Container History Logs
SELECT 
    h.HistoryID, 
    h.ContainerID, 
    h.Status, 
    h.Location, 
    h.Timestamp, 
    h.Remarks
FROM ContainerHistory h
ORDER BY h.Timestamp DESC;