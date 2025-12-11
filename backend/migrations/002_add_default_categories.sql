-- Migration: Add default categories for all users and create trigger for new users

-- Insert default categories for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        -- Insert default categories if they don't already exist for this user
        INSERT INTO categories (user_id, name, type, is_active)
        SELECT
            user_record.id,
            category_name,
            category_type,
            true
        FROM (VALUES
            ('Utilities', 'expense'),
            ('Groceries', 'expense'),
            ('Rent/Mortgage', 'expense'),
            ('Transportation', 'expense'),
            ('Entertainment', 'expense'),
            ('Healthcare', 'expense'),
            ('Insurance', 'expense'),
            ('Dining Out', 'expense'),
            ('Shopping', 'expense'),
            ('Education', 'expense'),
            ('Personal Care', 'expense'),
            ('Subscriptions', 'expense'),
            ('Savings', 'expense'),
            ('Debt Payment', 'expense'),
            ('Salary', 'income'),
            ('Freelance', 'income'),
            ('Investments', 'income'),
            ('Other Income', 'income')
        ) AS default_categories(category_name, category_type)
        WHERE NOT EXISTS (
            SELECT 1 FROM categories
            WHERE user_id = user_record.id
            AND LOWER(name) = LOWER(default_categories.category_name)
        );
    END LOOP;
END $$;

-- Create function to add default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default categories for the newly created user
    INSERT INTO categories (user_id, name, type, is_active) VALUES
        (NEW.id, 'Utilities', 'expense', true),
        (NEW.id, 'Groceries', 'expense', true),
        (NEW.id, 'Rent/Mortgage', 'expense', true),
        (NEW.id, 'Transportation', 'expense', true),
        (NEW.id, 'Entertainment', 'expense', true),
        (NEW.id, 'Healthcare', 'expense', true),
        (NEW.id, 'Insurance', 'expense', true),
        (NEW.id, 'Dining Out', 'expense', true),
        (NEW.id, 'Shopping', 'expense', true),
        (NEW.id, 'Education', 'expense', true),
        (NEW.id, 'Personal Care', 'expense', true),
        (NEW.id, 'Subscriptions', 'expense', true),
        (NEW.id, 'Savings', 'expense', true),
        (NEW.id, 'Debt Payment', 'expense', true),
        (NEW.id, 'Salary', 'income', true),
        (NEW.id, 'Freelance', 'income', true),
        (NEW.id, 'Investments', 'income', true),
        (NEW.id, 'Other Income', 'income', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add default categories when a new user is created
DROP TRIGGER IF EXISTS trigger_create_default_categories ON users;
CREATE TRIGGER trigger_create_default_categories
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories_for_user();
