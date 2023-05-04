function dateInsertion(params) {
  if (params.range.getColumn() === 2 && (! params.range.isBlank())) {
    const sheet = params.range.getSheet();
    sheet.getRange(`D${params.range.getRow()}`).setValue(new Date());
  }
}
