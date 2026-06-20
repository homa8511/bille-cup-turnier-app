import { loginSchema, matchResultSchema, settingsSchema, pageContentSchema } from '../../../src/presentation/validators/PayloadValidators';

describe('PayloadValidators', () => {

    describe('loginSchema', () => {
        test('shouldReturnSuccessWhenLoginDataIsValid', () => {
            // Arrange
            const validData = { body: { username: 'admin', password: 'securepassword123' } };

            // Act
            const result = loginSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
        });

        test('shouldReturnErrorWhenUsernameIsTooShort', () => {
            // Arrange
            const invalidData = { body: { username: 'ad', password: 'securepassword123' } };

            // Act
            const result = loginSchema.safeParse(invalidData);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('matchResultSchema', () => {
        test('shouldReturnSuccessWhenMatchResultIsValid', () => {
            // Arrange
            const validData = {
                params: { id: '123e4567-e89b-12d3-a456-426614174000' },
                body: { goals_home: 2, goals_away: 1 }
            };

            // Act
            const result = matchResultSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
        });

        test('shouldReturnErrorWhenGoalsAreNegative', () => {
            // Arrange
            const invalidData = {
                params: { id: '123e4567-e89b-12d3-a456-426614174000' },
                body: { goals_home: -1, goals_away: 1 }
            };

            // Act
            const result = matchResultSchema.safeParse(invalidData);

            // Assert
            expect(result.success).toBe(false);
        });

        test('shouldReturnErrorWhenIdIsNotUUID', () => {
            // Arrange
            const invalidData = {
                params: { id: 'invalid-id-format' },
                body: { goals_home: 2, goals_away: 1 }
            };

            // Act
            const result = matchResultSchema.safeParse(invalidData);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('settingsSchema', () => {
        test('shouldReturnSuccessWhenSettingsAreValid', () => {
            // Arrange
            const validData = {
                body: {
                    match_duration_minutes: 12,
                    pause_duration_minutes: 3,
                    phase_start_time: '2026-06-27T09:00:00Z',
                    footer_text_de: 'Test',
                    footer_text_en: 'Test'
                }
            };

            // Act
            const result = settingsSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
        });

        test('shouldReturnErrorWhenDurationExceedsLimit', () => {
            // Arrange
            const invalidData = {
                body: {
                    match_duration_minutes: 150, // Max ist 120
                    pause_duration_minutes: 3
                }
            };

            // Act
            const result = settingsSchema.safeParse(invalidData);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('pageContentSchema', () => {
        test('shouldReturnSuccessWhenPageContentIsValid', () => {
            // Arrange
            const validData = {
                params: { slug: 'rules-2026' },
                body: {
                    title_de: 'Regeln',
                    title_en: 'Rules',
                    content_de: 'Inhalt',
                    content_en: 'Content'
                }
            };

            // Act
            const result = pageContentSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
        });

        test('shouldReturnErrorWhenSlugContainsInvalidCharacters', () => {
            // Arrange
            const invalidData = {
                params: { slug: 'InvalidSlug!' },
                body: {
                    title_de: 'Regeln',
                    title_en: 'Rules',
                    content_de: 'Inhalt',
                    content_en: 'Content'
                }
            };

            // Act
            const result = pageContentSchema.safeParse(invalidData);

            // Assert
            expect(result.success).toBe(false);
        });
    });
});