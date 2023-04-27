function getDriveFiles(driveId) {
  const result = {};

  const folder = DriveApp.getFolderById(driveId);
  result.id = driveId;
  result.name = folder.getName();

  result.files = [];
  const files = folder.getFiles();
  while(files.hasNext()) {
    const file = files.next();
    result.files.push({
      name: file.getName(),
      id: file.getId()
    });
  }

  result.folders = [];
  const folders = folder.getFolders();
  while(folders.hasNext()) {
    const folder = folders.next();
    result.folders.push(getDriveFiles(folder.getId()));
  }

  return result;
}
