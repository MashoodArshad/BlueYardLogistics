USE BlueYardDB;
GO

-- 1. Truncate / Delete and reset history
DELETE FROM ContainerHistory;

-- 2. Yard slots ko empty karein
UPDATE YardSlots SET IsOccupied = 0, ContainerID = NULL;

-- 3. Vehicles ko restore karein
UPDATE Vehicles SET Status = 'Available';

-- 4. Warehouses aur Terminals ka load zero karein
UPDATE Warehouses SET CurrentLoad = 0;
UPDATE Terminals SET CurrentLoad = 0;

-- 5. Containers ko "Manifested" reset karein aur dynamic fields null karein
UPDATE Containers 
SET Status = 'Manifested',
    PriorityScore = NULL,
    RiskLevel = NULL,
    ExpectedDwellHours = NULL,
    AssignedTerminalID = NULL,
    AssignedYardSlot = NULL,
    AssignedWarehouseID = NULL,
    AssignedVehicleID = NULL,
    OptimalRoute = NULL,
    TotalRouteDistanceKm = NULL;
GO