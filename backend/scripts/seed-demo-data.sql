-- Seed script for demo data
-- Run with: docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/scripts/seed-demo-data.sql

-- Get the user ID for test@account.com
DO $$
DECLARE
    demo_user_id INTEGER;
    groceries_cat_id INTEGER;
    utilities_cat_id INTEGER;
    entertainment_cat_id INTEGER;
    transportation_cat_id INTEGER;
    dining_cat_id INTEGER;
    income_cat_id INTEGER;
    shopping_cat_id INTEGER;
    health_cat_id INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO demo_user_id FROM users WHERE email = 'test@account.com';

    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'User test@account.com not found. Please register first.';
    END IF;

    RAISE NOTICE 'Found user ID: %', demo_user_id;

    -- Get category IDs (from default categories)
    SELECT id INTO groceries_cat_id FROM categories WHERE name = 'Groceries' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO utilities_cat_id FROM categories WHERE name = 'Utilities' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO entertainment_cat_id FROM categories WHERE name = 'Entertainment' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO transportation_cat_id FROM categories WHERE name = 'Transportation' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO dining_cat_id FROM categories WHERE name = 'Dining Out' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO income_cat_id FROM categories WHERE name = 'Salary' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO shopping_cat_id FROM categories WHERE name = 'Shopping' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;
    SELECT id INTO health_cat_id FROM categories WHERE name = 'Healthcare' AND (user_id = demo_user_id OR user_id IS NULL) LIMIT 1;

    -- Clear existing demo data for this user (optional - comment out to keep adding)
    -- Delete in correct order due to foreign key constraints
    DELETE FROM receipts WHERE user_id = demo_user_id;
    DELETE FROM transactions WHERE user_id = demo_user_id;
    DELETE FROM bills WHERE user_id = demo_user_id;

    RAISE NOTICE 'Cleared existing data for user';

    -- =====================
    -- INSERT TRANSACTIONS
    -- =====================

    -- Income transactions
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 4500.00, '2026-01-01', 'Acme Corporation', 'Monthly salary', 'income', income_cat_id),
        (demo_user_id, 4500.00, '2025-12-01', 'Acme Corporation', 'Monthly salary', 'income', income_cat_id),
        (demo_user_id, 4500.00, '2025-11-01', 'Acme Corporation', 'Monthly salary', 'income', income_cat_id),
        (demo_user_id, 250.00, '2026-01-10', 'Freelance Client', 'Website design project', 'income', income_cat_id),
        (demo_user_id, 150.00, '2025-12-20', 'Side Gig', 'Consulting work', 'income', income_cat_id);

    -- Grocery expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 156.78, '2026-01-12', 'Whole Foods Market', 'Weekly groceries', 'expense', groceries_cat_id),
        (demo_user_id, 89.45, '2026-01-05', 'Trader Joes', 'Groceries and snacks', 'expense', groceries_cat_id),
        (demo_user_id, 234.12, '2025-12-28', 'Costco', 'Bulk groceries', 'expense', groceries_cat_id),
        (demo_user_id, 67.89, '2025-12-21', 'Safeway', 'Quick grocery run', 'expense', groceries_cat_id),
        (demo_user_id, 112.34, '2025-12-14', 'Whole Foods Market', 'Weekly groceries', 'expense', groceries_cat_id),
        (demo_user_id, 45.67, '2025-12-07', 'Target', 'Groceries and household', 'expense', groceries_cat_id);

    -- Dining expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 45.67, '2026-01-11', 'Olive Garden', 'Dinner with family', 'expense', dining_cat_id),
        (demo_user_id, 23.45, '2026-01-08', 'Chipotle', 'Lunch', 'expense', dining_cat_id),
        (demo_user_id, 78.90, '2026-01-03', 'The Cheesecake Factory', 'Birthday dinner', 'expense', dining_cat_id),
        (demo_user_id, 15.99, '2025-12-30', 'Starbucks', 'Coffee and pastry', 'expense', dining_cat_id),
        (demo_user_id, 34.56, '2025-12-25', 'Panera Bread', 'Christmas lunch', 'expense', dining_cat_id),
        (demo_user_id, 52.30, '2025-12-18', 'Thai Restaurant', 'Takeout dinner', 'expense', dining_cat_id);

    -- Utility expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 125.00, '2026-01-05', 'Electric Company', 'January electric bill', 'expense', utilities_cat_id),
        (demo_user_id, 85.00, '2026-01-03', 'Gas Company', 'January gas bill', 'expense', utilities_cat_id),
        (demo_user_id, 65.00, '2026-01-02', 'Water Utility', 'January water bill', 'expense', utilities_cat_id),
        (demo_user_id, 89.99, '2026-01-01', 'Comcast', 'Internet service', 'expense', utilities_cat_id),
        (demo_user_id, 118.00, '2025-12-05', 'Electric Company', 'December electric bill', 'expense', utilities_cat_id),
        (demo_user_id, 95.00, '2025-12-03', 'Gas Company', 'December gas bill', 'expense', utilities_cat_id);

    -- Transportation expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 55.00, '2026-01-10', 'Shell Gas Station', 'Gas fill-up', 'expense', transportation_cat_id),
        (demo_user_id, 48.50, '2026-01-02', 'Chevron', 'Gas fill-up', 'expense', transportation_cat_id),
        (demo_user_id, 52.75, '2025-12-22', 'Shell Gas Station', 'Gas fill-up', 'expense', transportation_cat_id),
        (demo_user_id, 450.00, '2025-12-15', 'Jiffy Lube', 'Oil change and maintenance', 'expense', transportation_cat_id),
        (demo_user_id, 35.00, '2025-12-10', 'Parking Garage', 'Monthly parking', 'expense', transportation_cat_id);

    -- Entertainment expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 15.99, '2026-01-01', 'Netflix', 'Monthly subscription', 'expense', entertainment_cat_id),
        (demo_user_id, 10.99, '2026-01-01', 'Spotify', 'Music subscription', 'expense', entertainment_cat_id),
        (demo_user_id, 45.00, '2026-01-06', 'AMC Theaters', 'Movie tickets', 'expense', entertainment_cat_id),
        (demo_user_id, 89.99, '2025-12-24', 'Steam', 'Video games', 'expense', entertainment_cat_id),
        (demo_user_id, 25.00, '2025-12-20', 'Bowling Alley', 'Family bowling night', 'expense', entertainment_cat_id);

    -- Shopping expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 156.89, '2026-01-08', 'Amazon', 'Household items', 'expense', shopping_cat_id),
        (demo_user_id, 89.99, '2025-12-26', 'Best Buy', 'Electronics', 'expense', shopping_cat_id),
        (demo_user_id, 234.50, '2025-12-23', 'Macys', 'Winter clothing', 'expense', shopping_cat_id),
        (demo_user_id, 67.00, '2025-12-15', 'Home Depot', 'Home improvement', 'expense', shopping_cat_id);

    -- Healthcare expenses
    INSERT INTO transactions (user_id, amount, transaction_date, merchant_name, description, transaction_type, category_id)
    VALUES
        (demo_user_id, 25.00, '2026-01-09', 'CVS Pharmacy', 'Prescriptions', 'expense', health_cat_id),
        (demo_user_id, 150.00, '2025-12-12', 'Dr. Smith Office', 'Annual checkup copay', 'expense', health_cat_id),
        (demo_user_id, 45.00, '2025-12-01', 'Dentist', 'Dental cleaning', 'expense', health_cat_id);

    RAISE NOTICE 'Inserted transactions';

    -- =====================
    -- INSERT BILLS
    -- =====================

    INSERT INTO bills (user_id, bill_name, amount, due_day, category_id, is_paid)
    VALUES
        (demo_user_id, 'Rent', 1500.00, 1, NULL, false),
        (demo_user_id, 'Electric Bill', 125.00, 15, utilities_cat_id, false),
        (demo_user_id, 'Gas Bill', 85.00, 18, utilities_cat_id, false),
        (demo_user_id, 'Water Bill', 65.00, 20, utilities_cat_id, false),
        (demo_user_id, 'Internet', 89.99, 5, utilities_cat_id, true),
        (demo_user_id, 'Car Insurance', 145.00, 25, transportation_cat_id, false),
        (demo_user_id, 'Phone Bill', 85.00, 22, utilities_cat_id, false),
        (demo_user_id, 'Netflix', 15.99, 1, entertainment_cat_id, true),
        (demo_user_id, 'Spotify', 10.99, 1, entertainment_cat_id, true),
        (demo_user_id, 'Gym Membership', 49.99, 10, health_cat_id, false),
        (demo_user_id, 'Student Loan', 350.00, 28, NULL, false),
        (demo_user_id, 'Credit Card', 200.00, 15, NULL, false);

    RAISE NOTICE 'Inserted bills';

    RAISE NOTICE 'Demo data seeded successfully!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Income transactions: 5';
    RAISE NOTICE '  - Expense transactions: ~35';
    RAISE NOTICE '  - Bills: 12';

END $$;

-- Show summary
SELECT 'Transactions' as type, COUNT(*) as count FROM transactions WHERE user_id = (SELECT id FROM users WHERE email = 'test@account.com')
UNION ALL
SELECT 'Bills' as type, COUNT(*) as count FROM bills WHERE user_id = (SELECT id FROM users WHERE email = 'test@account.com');
