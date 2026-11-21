from .schemas import MedicationSummary


def render_summary(summary: MedicationSummary) -> str:
    """Render a MedicationSummary as plain text for a doctor-ready download."""
    lines = [
        summary.title,
        f"Patient ID: {summary.patient_id}",
        "",
        "Current medications:",
    ]

    if summary.current_medications:
        for medicine in summary.current_medications:
            lines.append(
                f"- {medicine.name} | dose: {medicine.dose or 'not recorded'} "
                f"| frequency: {medicine.frequency or 'not recorded'} | source: {medicine.source}"
            )
    else:
        lines.append("- None recorded")

    lines.extend(["", "Clarifications:"])
    if summary.clarifications:
        for clarification in summary.clarifications:
            lines.extend(
                [
                    f"- Medicine: {clarification.medicine}",
                    f"  Question: {clarification.question}",
                    f"  Reviewer status: {clarification.reviewer_status}",
                    "  Patient instruction: None (clarification only)",
                ]
            )
    else:
        lines.append("- None")

    lines.extend(["", f"Review note: {summary.review_note}"])
    return "\n".join(lines)
