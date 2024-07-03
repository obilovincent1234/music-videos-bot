from bot_logic import *
from telegram.ext import Application, CommandHandler, MessageHandler, filters,CallbackQueryHandler
from secret import TOKEN
print('Starting up bot...')
db.db_create_tables()

# Run the program
if __name__ == '__main__':
    app = Application.builder().token(TOKEN).build()

    # Commands
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(CommandHandler('about', About_command))
    # Messages
    app.add_handler(MessageHandler(filters.TEXT, handle_message))
    app.add_handler(CallbackQueryHandler(inline_button_callback))
    # Log all errors
    app.add_error_handler(error)

    print('Polling...')
    # Run the bot
    app.run_polling(poll_interval=5)
