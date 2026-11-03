USE BlueYardDB;
GO

-- 1. Create Stock Table
IF OBJECT_ID('dbo.WarehouseStock', 'U') IS NOT NULL DROP TABLE dbo.WarehouseStock;
CREATE TABLE WarehouseStock (
    StockID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseID VARCHAR(20) NOT NULL,
    CargoType NVARCHAR(50) NOT NULL,
    CurrentUnits INT NOT NULL DEFAULT 0,
    MinimumRequired INT NOT NULL DEFAULT 10,
    MaximumCapacity INT NOT NULL DEFAULT 100,
    LastUpdated DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Stock_Warehouse FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- Seed Stock
INSERT INTO WarehouseStock (WarehouseID, CargoType, CurrentUnits, MinimumRequired, MaximumCapacity) VALUES
('W1', 'Medicine', 8, 20, 50),
('W1', 'Food', 15, 25, 60),
('W2', 'Clothing', 45, 20, 100),
('W2', 'Stationery', 30, 15, 80),
('W2', 'Toys', 12, 20, 70),
('W3', 'Electronics', 5, 15, 40),
('W3', 'Toys', 25, 20, 80);
GO

-- 2. Create Communication Table
IF OBJECT_ID('dbo.WarehouseCommunication', 'U') IS NOT NULL DROP TABLE dbo.WarehouseCommunication;
CREATE TABLE WarehouseCommunication (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseID VARCHAR(20) NOT NULL,
    MessageType NVARCHAR(50) NOT NULL,
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal',
    Message NVARCHAR(500) NOT NULL,
    Direction NVARCHAR(20) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    IsResolved BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Comm_Warehouse FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- Seed Comm Logs
INSERT INTO WarehouseCommunication (WarehouseID, MessageType, Priority, Message, Direction) VALUES
('W1', 'DemandRequest', 'High', 'Critical shortage: Medicine stock at 8 units (minimum 20 required). Urgent cold-chain delivery requested.', 'WH_TO_PORT'),
('W3', 'DemandRequest', 'High', 'Electronics inventory critical: 5 units remaining. Request immediate restocking.', 'WH_TO_PORT'),
('W2', 'StockAlert', 'Normal', 'Toys stock below optimal threshold (12/20). Scheduled replenishment advised.', 'WH_TO_PORT'),
('W1', 'ArrivalConfirmation', 'Normal', 'Vehicle V1 (Arctic Wolf Reefer) arrived with Container C001 at 14:32. Unloading initiated.', 'WH_TO_PORT');
GO