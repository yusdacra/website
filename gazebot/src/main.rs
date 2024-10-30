use reqwest::header::AUTHORIZATION;
use serenity::all::ActivityData;
use serenity::async_trait;
use serenity::json::json;
use serenity::model::channel::Message;
use serenity::model::prelude::*;
use serenity::prelude::*;
use shuttle_runtime::SecretStore;

struct Handler {
    http: reqwest::Client,
    secrets: SecretStore,
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, _: Context, msg: Message) {
        if msg.content.starts_with("do ") {
            return;
        }

        let mut note_content = msg.content.clone();
        
        const BSKY_TAG: &str = ".nobsky";
        let post_to_bsky = !note_content.contains(BSKY_TAG);
        if post_to_bsky {
            note_content = note_content.replace(BSKY_TAG, "");
        }

        let note_data = json!({"content": note_content.trim(), "bskyPosse": post_to_bsky});
        let resp = self
            .http
            .post("https://gaze.systems/log/create")
            .header(AUTHORIZATION, self.secrets.get("DISCORD_TOKEN").unwrap())
            .json(&note_data)
            .send()
            .await
            .and_then(|resp| resp.error_for_status());
        
        if let Err(why) = resp {
            tracing::error!("could not create note: {why}");
        }
    }

    async fn ready(&self, ctx: Context, ready: Ready) {
        tracing::info!("{} is connected!", ready.user.name);

        ctx.set_presence(
            Some(ActivityData::listening("messages")),
            OnlineStatus::Online,
        );
    }
}

#[shuttle_runtime::main]
async fn serenity(
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_serenity::ShuttleSerenity {
    let token = secrets.get("DISCORD_TOKEN").unwrap();

    let intents = GatewayIntents::DIRECT_MESSAGES | GatewayIntents::MESSAGE_CONTENT;

    let client = Client::builder(&token, intents)
        .event_handler(Handler {
            http: reqwest::Client::new(),
            secrets,
        })
        .await
        .expect("Err creating client");

    Ok(client.into())
}
