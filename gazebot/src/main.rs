use std::env;

use serenity::all::ActivityData;
use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::prelude::*;
use serenity::prelude::*;
use shuttle_runtime::SecretStore;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.content == "!ping" {
            if let Err(why) = msg.channel_id.say(&ctx.http, "Pong!").await {
                println!("Error sending message: {why:?}");
            }
        }
    }

    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);

        ctx.set_presence(Some(ActivityData::listening("messages to log")), OnlineStatus::Online);
    }
}

// #[tokio::main]
// async fn main() {
//     let _ = dotenvy::dotenv();

//     tracing_subscriber::fmt::init();

//     let token = env::var("DISCORD_TOKEN").expect("Expected a token in the environment");
//     let intents = GatewayIntents::DIRECT_MESSAGES | GatewayIntents::MESSAGE_CONTENT;

//     let mut client =
//         Client::builder(&token, intents).event_handler(Handler).await.expect("Err creating client");

//     if let Err(why) = client.start().await {
//         println!("Client error: {why:?}");
//     }
// }

#[shuttle_runtime::main]
async fn serenity(
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_serenity::ShuttleSerenity {
    // Get the discord token set in `Secrets.toml`
    let token = secrets.get("DISCORD_TOKEN").unwrap();

    // Set gateway intents, which decides what events the bot will be notified about
    let intents = GatewayIntents::DIRECT_MESSAGES | GatewayIntents::MESSAGE_CONTENT;

    let client = Client::builder(&token, intents)
        .event_handler(Handler)
        .await
        .expect("Err creating client");

    Ok(client.into())
}