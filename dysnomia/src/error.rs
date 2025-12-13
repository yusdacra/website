use miette::{GraphicalReportHandler, Report, SourceCode, SourceSpan, SpanContents};

pub struct CommandError {
    pub error: Report,
    pub start_offset: usize,
}

pub struct OffsetSource {
    pub source: String,
    pub start_offset: usize,
}

pub struct OffsetSpanContents<'a> {
    inner: Box<dyn SpanContents<'a> + 'a>,
    global_span: SourceSpan,
}

impl<'a> SpanContents<'a> for OffsetSpanContents<'a> {
    fn data(&self) -> &'a [u8] {
        self.inner.data()
    }
    fn span(&self) -> &SourceSpan {
        &self.global_span
    }
    fn line(&self) -> usize {
        self.inner.line()
    }
    fn column(&self) -> usize {
        self.inner.column()
    }
    fn line_count(&self) -> usize {
        self.inner.line_count()
    }
}

impl SourceCode for OffsetSource {
    fn read_span<'b>(
        &'b self,
        span: &SourceSpan,
        context_lines_before: usize,
        context_lines_after: usize,
    ) -> Result<Box<dyn miette::SpanContents<'b> + 'b>, miette::MietteError> {
        let local_start = span.offset().saturating_sub(self.start_offset);
        let local_len = std::cmp::min(span.len(), self.source.len().saturating_sub(local_start));
        let local_span = SourceSpan::new(local_start.into(), local_len);

        let local_contents =
            self.source
                .read_span(&local_span, context_lines_before, context_lines_after)?;

        let content_local_span = local_contents.span();
        let global_start = content_local_span.offset() + self.start_offset;
        let global_span = SourceSpan::new(global_start.into(), content_local_span.len());

        Ok(Box::new(OffsetSpanContents {
            inner: local_contents,
            global_span,
        }))
    }
}

pub fn format_error(error: Report, input: String, start_offset: usize) -> String {
    let handler = GraphicalReportHandler::new()
        .with_theme(miette::GraphicalTheme::unicode())
        .with_cause_chain();

    let source = OffsetSource {
        source: input,
        start_offset,
    };

    let report_with_source = error.with_source_code(source);
    let mut output = String::new();
    handler
        .render_report(&mut output, report_with_source.as_ref())
        .unwrap();
    output
}
