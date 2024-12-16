use reqwest::header::AUTHORIZATION;
use scc::HashMap as ConcurrentHashMap;
use serenity::{
    all::ActivityData,
    async_trait,
    json::Value as JsonValue,
    model::{channel::Message, prelude::*},
    prelude::*,
};
use shuttle_runtime::SecretStore;

const ADMIN_USER_ID: u64 = 853064602904166430;

struct Handler {
    http: reqwest::Client,
    secrets: SecretStore,
    notes: ConcurrentHashMap<MessageId, String>,
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.author.id != UserId::new(ADMIN_USER_ID) {
            return;
        }

        if msg.content.starts_with("do ") {
            return;
        }

        let mut note_content = msg.content.clone();

        const BSKY_TAG: &str = ".nobsky";
        let no_bsky_posse = note_content.contains(BSKY_TAG);
        if no_bsky_posse {
            note_content = note_content.replace(BSKY_TAG, "");
        }

        let mut note_data = serenity::json::JsonMap::new();
        note_data.insert(
            "content".to_string(),
            JsonValue::String(note_content.trim().to_string()),
        );
        note_data.insert("bskyPosse".to_string(), JsonValue::Bool(!no_bsky_posse));
        // add replyTo if we are replying to a previous message
        if let Some(reply_msg) = msg.referenced_message.as_deref() {
            if let Some(reply_note_id) = self
                .notes
                .read_async(&reply_msg.id, |_, v| v.to_owned())
                .await
            {
                note_data.insert("replyTo".to_string(), JsonValue::String(reply_note_id));
            }
        }
        let resp = self
            .http
            .post("https://gaze.systems/log/create")
            .header(AUTHORIZATION, self.secrets.get("DISCORD_TOKEN").unwrap())
            .json(&note_data)
            .send()
            .await
            .and_then(|resp| resp.error_for_status());

        let resp = match resp {
            Ok(r) => r,
            Err(why) => {
                tracing::error!("could not create note: {why}");
                return;
            }
        };

        let note_resp = resp.json::<serenity::json::JsonMap>().await.unwrap();
        let created_note_id = note_resp["noteId"]
            .as_str()
            .expect("note id must be a string");
        tracing::info!("succesfully created note with id {created_note_id}");

        self.notes
            .upsert_async(msg.id, created_note_id.to_string())
            .await;

        let mut reply_content =
            format!("created log at https://gaze.systems/log?id={created_note_id}");
        let errors = note_resp["errors"].as_array().expect("must be array");
        if !errors.is_empty() {
            reply_content.push_str("\n\nerrors:");
            for error in errors {
                reply_content.push_str("\n--> ");
                reply_content.push_str(error.as_str().expect("must be str"));
            }
        }

        let _ = msg.reply(ctx, reply_content).await;
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
            notes: ConcurrentHashMap::new(),
        })
        .await
        .expect("Err creating client");

    Ok(client.into())
}
